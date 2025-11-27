
import { GoogleGenAI, Content, Schema, Type } from "@google/genai";
import { ChatMessage, GroundingMetadata, ActionMode, LegalRegion, InheritanceInput, CaseType } from '../types';
import * as dbService from '../services/dbService';
import { getInstruction, getInheritanceExtractionPrompt } from '../services/legalPrompts';

// Constants for Token Management
const MAX_HISTORY_MESSAGES = 25;
const MAX_OUTPUT_TOKENS_FLASH = 8192;
const THINKING_BUDGET_PRO = 2048;

async function getGoogleGenAI(): Promise<GoogleGenAI> {
    let apiKey = '';

    if (process.env.API_KEY) {
        apiKey = process.env.API_KEY;
    }

    if (!apiKey) {
        try {
            const storedApiKey = await dbService.getSetting<string>('geminiApiKey');
            if (storedApiKey) {
                apiKey = storedApiKey;
            }
        } catch (e) {
            console.warn("Failed to read API key from DB", e);
        }
    }

    apiKey = apiKey.replace(/["']/g, '').trim();

    if (!apiKey || apiKey.length < 10) {
        console.warn("Gemini Service: Valid API key not found.");
    }

    return new GoogleGenAI({ apiKey });
}

function chatHistoryToGeminiContents(history: ChatMessage[]): Content[] {
    let lastUserMessageIndex = -1;
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role === 'user' && msg.images && msg.images.length > 0) {
            lastUserMessageIndex = i;
            break;
        }
    }

    return history.map((msg, index) => {
        const parts = [];
        if (msg.content) {
            parts.push({ text: msg.content });
        }
        
        if (msg.images && msg.images.length > 0) {
            if (index === lastUserMessageIndex) {
                msg.images.forEach(image => {
                    const base64Data = image.dataUrl.split(',')[1];
                    parts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: image.mimeType
                        }
                    });
                });
            } else {
                parts.push({ text: `[مرفق صورة سابق: تم تحليله مسبقاً لتوفير الموارد]` });
            }
        }
        return { role: msg.role, parts: parts };
    });
}

export async function countTokensForGemini(history: ChatMessage[]): Promise<number> {
    if (!history || history.length === 0) {
        return 0;
    }
    try {
        const ai = await getGoogleGenAI();
        const model = 'gemini-2.5-flash';
        const historyToCount = history.slice(-MAX_HISTORY_MESSAGES);
        const contents = chatHistoryToGeminiContents(historyToCount);
        const response = await ai.models.countTokens({
            model: model,
            contents: contents,
        });
        return response.totalTokens;
    } catch (error) {
        return 0;
    }
}

export async function proofreadTextWithGemini(textToProofread: string): Promise<string> {
    if (!textToProofread.trim()) return textToProofread;
    try {
        const ai = await getGoogleGenAI();
        const model = 'gemini-2.5-flash';
        const prompt = `أنت مدقق لغوي عربي خبير ومتخصص في تنقيح النصوص المستخرجة عبر تقنية OCR. مهمتك هي مراجعة النص التالي وتصحيح أي أخطاء إملائية أو نحوية مع الحفاظ الدقيق على المعنى الأصلي وهيكل التنسيق. انتبه بشكل خاص للحفاظ على فواصل الأسطر والفقرات كما هي في النص الأصلي. لا تضف أي معلومات أو تفسيرات جديدة. أعد النص المصحح باللغة العربية فقط.\n\النص الأصلي:\n---\n${textToProofread}\n---`;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        
        // Increment Request Count (1 request)
        dbService.incrementTokenUsage(1);

        return response.text || textToProofread;
    } catch (error) {
        console.error("Error proofreading text with Gemini:", error);
        return textToProofread;
    }
}

export async function summarizeChatHistory(history: ChatMessage[]): Promise<string> {
    if (!history || history.length === 0) return "لا يوجد محتوى لتلخيصه.";
    try {
        const ai = await getGoogleGenAI();
        const model = 'gemini-2.5-flash'; 
        const contents = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        contents.push({
            role: 'user',
            parts: [{ text: 'بناءً على المحادثة السابقة بأكملها، قم بتقديم ملخص شامل وواضح. يجب أن يركز الملخص على النقاط القانونية الرئيسية، الوقائع الأساسية، الاستراتيجيات المقترحة، والاستنتاجات التي تم التوصل إليها حتى الآن. قدم الملخص في نقاط منظمة. يجب أن يكون ردك باللغة العربية فقط.' }]
        });
        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
        });

        // Increment Request Count (1 request)
        dbService.incrementTokenUsage(1);

        return response.text || "فشل في إنشاء الملخص.";
    } catch (error) {
        console.error("Error summarizing chat history:", error);
        throw new Error("فشل في تلخيص المحادثة.");
    }
}

export async function* streamChatResponseFromGemini(
  history: ChatMessage[],
  thinkingMode: boolean,
  actionMode: ActionMode,
  region: LegalRegion,
  caseType: CaseType,
  signal: AbortSignal
): AsyncGenerator<{ text: string; model: string; groundingMetadata?: GroundingMetadata }> {
  try {
    const ai = await getGoogleGenAI();
    const model = thinkingMode ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
    // Retrieve centralized instruction
    const systemInstruction = getInstruction(actionMode, region, caseType);
    
    const historyToSend = history.slice(-MAX_HISTORY_MESSAGES);
    const contents = chatHistoryToGeminiContents(historyToSend);
    const tools = [{ googleSearch: {} }];
    const config: any = {
        systemInstruction: systemInstruction,
        tools: tools,
        maxOutputTokens: MAX_OUTPUT_TOKENS_FLASH,
    };
    if (thinkingMode) {
        config.thinkingConfig = { thinkingBudget: THINKING_BUDGET_PRO };
        config.maxOutputTokens = Math.max(MAX_OUTPUT_TOKENS_FLASH, THINKING_BUDGET_PRO + 4000);
    }
    const response = await ai.models.generateContentStream({
        model: model,
        contents: contents,
        config: config
    });
    
    let requestCounted = false;

    for await (const chunk of response) {
        if (signal.aborted) break;
        const text = chunk.text;
        let groundingMetadata: GroundingMetadata | undefined;
        if (chunk.candidates && chunk.candidates[0]?.groundingMetadata) {
            groundingMetadata = chunk.candidates[0].groundingMetadata as unknown as GroundingMetadata;
        }
        
        if (!requestCounted) {
            // Count 1 request as soon as we start getting chunks
            dbService.incrementTokenUsage(1);
            requestCounted = true;
        }

        if (text || groundingMetadata) {
            yield { text, model, groundingMetadata };
        }
    }

  } catch (error) {
    if (signal.aborted) return;
    console.error("Error in Gemini chat stream:", error);
    throw error;
  }
}

export async function analyzeImageWithGemini(
  base64ImageDataUrl: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  if (!base64ImageDataUrl || !mimeType) throw new Error("Image data and mime type are required.");
  try {
    const ai = await getGoogleGenAI();
    const model = 'gemini-2.5-flash';
    const base64Data = base64ImageDataUrl.split(',')[1];
    const imagePart = {
      inlineData: { data: base64Data, mimeType: mimeType }
    };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
        config: {
             systemInstruction: "أنت محلل صور قانوني ومستندي. دورك هو استخراج المعلومات بدقة.",
             maxOutputTokens: 4000,
        }
    });

    // Increment Request Count (1 request)
    dbService.incrementTokenUsage(1);

    return response.text || "لم يتم إنشاء أي نص.";
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
}

export async function extractInheritanceFromCase(caseText: string): Promise<Partial<InheritanceInput>> {
    try {
        const ai = await getGoogleGenAI();
        const model = 'gemini-3-pro-preview';

        // Use centralized inheritance prompt
        const prompt = getInheritanceExtractionPrompt(caseText);
        
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                religion: { type: Type.STRING, enum: ["muslim", "christian"] },
                estateValue: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                husband: { type: Type.INTEGER },
                wife: { type: Type.INTEGER },
                son: { type: Type.INTEGER },
                daughter: { type: Type.INTEGER },
                father: { type: Type.INTEGER },
                mother: { type: Type.INTEGER },
                brotherFull: { type: Type.INTEGER },
                sisterFull: { type: Type.INTEGER },
                husbandName: { type: Type.STRING },
                wifeName: { type: Type.STRING },
                sonNames: { type: Type.STRING },
                daughterNames: { type: Type.STRING },
                fatherName: { type: Type.STRING },
                motherName: { type: Type.STRING },
                context: {
                    type: Type.OBJECT,
                    properties: {
                        notes: { type: Type.STRING },
                        disputes: { type: Type.STRING },
                        conclusion: { type: Type.STRING },
                    },
                    required: ["notes", "disputes", "conclusion"]
                }
            },
            required: ["religion", "estateValue", "wife", "son", "daughter", "context"],
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        // Increment Request Count (1 request)
        dbService.incrementTokenUsage(1);

        const jsonText = response.text;
        if (!jsonText) throw new Error("No JSON returned");
        
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Inheritance Extraction Error:", error);
        throw error;
    }
}
