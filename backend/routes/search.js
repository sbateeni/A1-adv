import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OFFICIAL_PALESTINIAN_DOMAINS, BLACKLISTED_DOMAINS, sourcePriority } from '../config/sources.js';

const router = express.Router();

/**
 * POST /api/search
 * Search using Gemini with Google Search Grounding - Palestinian Sources ONLY
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

        console.log('🔍 Searching with Gemini Grounding (Palestinian sources only):', query);

        // Strict Palestinian official sources policy: rely on Birzeit/DFTP/etc. only

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{
                googleSearch: {}  // Enable Google Search grounding
            }]
        });

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{
                    text: `ابحث في المواقع الفلسطينية الرسمية فقط عن: ${query}

**مصادر مطلوبة حصراً:**
- site:birzeit.edu (المقتفي)
- site:dftp.gov.ps (ديوان الفتوى والتشريع)
- site:courts.gov.ps (المحاكم الفلسطينية)
- site:moj.pna.ps (وزارة العدل)
- site:darifta.ps (دار الإفتاء الفلسطينية)
- OR site:.ps (أي موقع فلسطيني موثوق)

**⚠️ ممنوع منعاً باتاً الاقتباس من:**
- القوانين الأردنية (.jo)
- القوانين المصرية
- القوانين القطرية (.qa)
- مواقع الفتاوى العامة (islamweb, binbaz)

أعطني 3-5 مصادر فلسطينية موثوقة فقط.`
                }]
            }],
            generationConfig: {
                temperature: 0.2,
            }
        });

        const response = result.response;
        const text = response.text();

        // Extract grounding metadata (sources from Google Search)
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        let results = [];

        if (groundingMetadata?.groundingChunks) {
            const palestinianDomains = OFFICIAL_PALESTINIAN_DOMAINS;
            const blacklistedDomains = BLACKLISTED_DOMAINS;

            results = groundingMetadata.groundingChunks
                .filter(chunk => {
                    if (!chunk.web?.uri) return false;

                    const url = chunk.web.uri.toLowerCase();

                    // Check blacklist
                    if (blacklistedDomains.some(domain => url.includes(domain))) {
                        console.log(`❌ Rejected blacklisted: ${url}`);
                        return false;
                    }

                    // Check whitelist
                    const isPalestinian = palestinianDomains.some(domain => url.includes(domain));
                    if (!isPalestinian) {
                        console.log(`⚠️ Rejected non-Palestinian: ${url}`);
                    }
                    return isPalestinian;
                })
                .map(chunk => ({
                    title: chunk.web.title || 'مصدر قانوني فلسطيني',
                    link: chunk.web.uri,
                    snippet: text.substring(0, 300),
                    source: new URL(chunk.web.uri).hostname
                })).sort((a, b) => sourcePriority(a.source) - sourcePriority(b.source));

            console.log(`✅ Found ${results.length} Palestinian sources via Gemini Grounding`);
        } else {
            // Fallback: extract URLs with filtering
            const urlRegex = /https?:\/\/[^\s]+/g;
            const urls = text.match(urlRegex) || [];

            results = urls
                .filter(url => url.includes('.ps') || url.includes('birzeit.edu'))
                .slice(0, 3)
                .map(url => ({
                    title: 'مصدر قانوني فلسطيني',
                    link: url,
                    snippet: text.substring(0, 300),
                    source: new URL(url).hostname
                })).sort((a, b) => sourcePriority(a.source) - sourcePriority(b.source));
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
