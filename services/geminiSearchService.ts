import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Search using Gemini with Google Search Grounding
 * No need for Google Custom Search API!
 */
export async function searchWithGemini(query: string, geminiApiKey: string): Promise<any[]> {
    try {
        console.log('🔍 Searching with Gemini Grounding:', query);

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            tools: [{
                googleSearch: {}  // Enable Google Search grounding
            }]
        });

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{
                    text: `ابحث عن معلومات قانونية فلسطينية حول: ${query}\n\nأعطني 3-5 مصادر موثوقة مع روابطها.`
                }]
            }],
            generationConfig: {
                temperature: 0.3,
            }
        });

        const response = result.response;
        const text = response.text();

        // Extract grounding metadata (sources)
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata?.groundingChunks) {
            const sources = groundingMetadata.groundingChunks.map((chunk: any) => ({
                title: chunk.web?.title || 'مصدر قانوني',
                link: chunk.web?.uri || '',
                snippet: text.substring(0, 200), // Use part of Gemini's response
                source: chunk.web?.uri ? new URL(chunk.web.uri).hostname : 'gemini'
            }));

            console.log(`✅ Found ${sources.length} sources via Gemini Grounding`);
            return sources;
        }

        // Fallback: parse response text for URLs
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = text.match(urlRegex) || [];

        return urls.slice(0, 3).map(url => ({
            title: 'مصدر قانوني من Gemini',
            link: url,
            snippet: text.substring(0, 200),
            source: new URL(url).hostname
        }));

    } catch (error) {
        console.error('Gemini search error:', error);
        return [];
    }
}
