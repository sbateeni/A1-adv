
import { ChatMessage, GroundingMetadata, ActionMode, LegalRegion, InheritanceInput, CaseType } from '../types';
import { getInstruction, getInheritanceExtractionPrompt } from './legalPrompts';
import * as dbService from '../services/dbService';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL_NAME = 'google/gemini-flash-1.5';

const MODELS_WITHOUT_SYSTEM_PROMPT: string[] = [
    'mistralai/mistral-7b-instruct',
    'nousresearch/nous-hermes-2-mistral-7b-dpo'
];

export async function analyzeImageWithOpenRouter(
  apiKey: string,
  base64Image: string,
  modelName: string,
  prompt: string
): Promise<string> {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          'HTTP-Referer': 'https://aistudio.google.com',
          'X-Title': encodeURIComponent('المستشار القانوني الفلسطيني - تحليل صور'),
      },
      body: JSON.stringify({
          model: modelName,
          messages: [
              {
                  role: "user",
                  content: [
                      { type: "text", text: prompt },
                      { 
                        type: "image_url", 
                        image_url: {
                          url: base64Image
                        }
                      }
                  ]
              }
          ],
          max_tokens: 2048,
      })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error?.message || `HTTP error! status: ${response.status}`);
    }

    // Increment request count
    dbService.incrementTokenUsage(1);

    const result = await response.json();
    return result.choices[0]?.message?.content || "No response";
}

export async function proofreadTextWithOpenRouter(
    apiKey: string,
    textToProofread: string,
    modelName: string
  ): Promise<string> {
      if (!textToProofread.trim()) return textToProofread;
      try {
          const prompt = `أنت مدقق لغوي عربي خبير. صحح النص التالي (OCR) لغوياً فقط:\n\n${textToProofread}`;
          const response = await fetch(OPENROUTER_API_URL, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  model: modelName,
                  messages: [{ role: 'user', content: prompt }],
              }),
          });
          
          // Increment request count
          dbService.incrementTokenUsage(1);

          const result = await response.json();
          return result.choices[0]?.message?.content || textToProofread;
      } catch (error) {
          return textToProofread;
      }
}


export async function* streamChatResponseFromOpenRouter(
  apiKey: string,
  history: ChatMessage[],
  modelName: string = DEFAULT_MODEL_NAME,
  actionMode: ActionMode,
  region: LegalRegion,
  caseType: CaseType,
  signal: AbortSignal
): AsyncGenerator<{ text: string; model: string; groundingMetadata?: GroundingMetadata }> {
  
  // Retrieve centralized instruction
  const systemInstruction = getInstruction(actionMode, region, caseType);

  const messagesForApi = history.map(msg => {
    const role = msg.role === 'model' ? 'assistant' : 'user';
    if (role === 'user' && msg.images && msg.images.length > 0) {
      const content: any[] = [];
      if (msg.content) content.push({ type: 'text', text: msg.content });
      msg.images.forEach(image => content.push({ type: 'image_url', image_url: { url: image.dataUrl } }));
      return { role, content };
    }
    return { role, content: msg.content };
  });

  let finalMessages;
  if (MODELS_WITHOUT_SYSTEM_PROMPT.includes(modelName)) {
      finalMessages = [...messagesForApi];
      const firstUserMessageIndex = finalMessages.findIndex(msg => msg.role === 'user');
      if (firstUserMessageIndex !== -1) {
          const firstUserMessage = finalMessages[firstUserMessageIndex];
          if (typeof firstUserMessage.content === 'string') {
            const newContent = `${systemInstruction}\n\n---\n\n${firstUserMessage.content}`;
            finalMessages[firstUserMessageIndex] = { ...firstUserMessage, content: newContent };
          }
      }
  } else {
      finalMessages = [
        { role: 'system', content: systemInstruction },
        ...messagesForApi
      ];
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://aistudio.google.com',
      'X-Title': encodeURIComponent('المستشار القانوني الفلسطيني'),
    },
    body: JSON.stringify({
      model: modelName,
      messages: finalMessages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error?.message || `HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to get response reader');
  const decoder = new TextDecoder();

  // Increment request count (1 per stream initiation)
  dbService.incrementTokenUsage(1);

  try {
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim() === '' || !line.startsWith('data: ')) continue;
        const data = line.substring(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) yield { text: content, model: modelName };
        } catch (e) {}
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function extractInheritanceFromCaseWithOpenRouter(apiKey: string, model: string, caseText: string): Promise<Partial<InheritanceInput>> {
    // Use centralized inheritance prompt
    const prompt = getInheritanceExtractionPrompt(caseText);

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt + "\n\nReturn ONLY JSON." }],
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) throw new Error("OpenRouter extraction failed");
    
    // Increment request count
    dbService.incrementTokenUsage(1);

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    if (!content) throw new Error("No content returned");
    
    try { return JSON.parse(content); } catch (e) { 
        const match = content.match(/```json([\s\S]*?)```/);
        if (match) return JSON.parse(match[1]);
        throw e;
    }
}
