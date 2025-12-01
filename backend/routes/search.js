import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

/**
 * POST /api/search
 * Search using Gemini with Google Search Grounding (FREE!)
 */
router.post('/', async (req, res) => {
    try {
        const { query, geminiApiKey } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query is required' });
        }

        if (!geminiApiKey) {
            return res.status(400).json({
                error: 'Gemini API key is required (sent from client)'
            });
        }

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
                    text: `ابحث في الإنترنت عن معلومات قانونية فلسطينية حول: ${query}\n\nقدم 3-5 مصادر موثوقة مع روابطها المباشرة.`
                }]
            }],
            generationConfig: {
                temperature: 0.3,
            }
        });

        const response = result.response;
        const text = response.text();

        // Extract grounding metadata (sources from Google Search)
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        let results = [];

        if (groundingMetadata?.groundingChunks) {
            results = groundingMetadata.groundingChunks
                .filter(chunk => chunk.web?.uri)
                .map(chunk => ({
                    title: chunk.web.title || 'مصدر قانوني',
                    link: chunk.web.uri,
                    snippet: text.substring(0, 300),
                    source: new URL(chunk.web.uri).hostname
                }));

            console.log(`✅ Found ${results.length} sources via Gemini Grounding`);
        } else {
            // Fallback: extract URLs from response
            const urlRegex = /https?:\/\/[^\s]+/g;
            const urls = text.match(urlRegex) || [];

            results = urls.slice(0, 3).map(url => ({
                title: 'مصدر قانوني',
                link: url,
                snippet: text.substring(0, 300),
                source: new URL(url).hostname
            }));
        }

        res.json({ results, geminiResponse: text });

    } catch (error) {
        console.error('Gemini search error:', error);
        res.status(500).json({
            error: 'Search failed',
            message: error.message
        });
    }
});

export default router;
