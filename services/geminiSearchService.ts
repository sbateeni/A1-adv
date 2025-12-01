import { GoogleGenerativeAI, DynamicRetrievalMode } from '@google/generative-ai';

/**
 * Search using Gemini with Google Search Grounding - Palestinian Sources ONLY
 */
export async function searchWithGemini(query: string, geminiApiKey: string): Promise<any[]> {
    try {
        console.log('🔍 Searching with Gemini Grounding (Palestinian sources only):', query);

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{
                googleSearchRetrieval: {
                    dynamicRetrievalConfig: {
                        mode: DynamicRetrievalMode.MODE_DYNAMIC,
                        dynamicThreshold: 0.7,
                    }
                }
            }]
        });

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{
                    text: `ابحث في المواقع الفلسطينية الرسمية فقط عن: ${query}

**مصادر مطلوبة حصراً:**
- site:birzeit.edu (المقتفي - أهم قاعدة للقوانين الفلسطينية)
- site:dftp.gov.ps (ديوان الفتوى والتشريع - الجريدة الرسمية)
- site:courts.gov.ps (المحاكم الفلسطينية)
- site:moj.pna.ps (وزارة العدل الفلسطينية)
- site:darifta.ps (دار الإفتاء الفلسطينية)
- OR site:.ps (أي موقع فلسطيني موثوق)

**⚠️ ممنوع منعاً باتاً الاقتباس من:**
- القوانين الأردنية (site:.jo)
- القوانين المصرية
- القوانين القطرية (site:.qa)
- مواقع الفتاوى العامة (islamweb.net, binbaz.org.sa)

أعطني 3-5 مصادر فلسطينية موثوقة فقط مع روابطها المباشرة.`
                }]
            }],
            generationConfig: {
                temperature: 0.2, // Lower for more focused Palestinian results
            }
        });

        const response = result.response;
        const text = response.text();

        // Extract grounding metadata (sources)
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata?.groundingChunks) {
            // Palestinian official domains whitelist
            const palestinianDomains = [
                'birzeit.edu', 'dftp.gov.ps', 'courts.gov.ps',
                'moj.pna.ps', 'pgp.ps', 'palestinebar.ps',
                'maqam.najah.edu', 'darifta.ps', 'qou.edu',
                '.ps' // Any .ps domain
            ];

            // Blacklist of non-Palestinian sources
            const blacklistedDomains = [
                '.jo', '.eg', '.qa', '.sa', // Arab countries
                'aliftaa.jo', 'islamweb.net', 'islamway.net',
                'mawdoo3.com', 'wikipedia.org', 'binbaz.org.sa'
            ];

            const sources = groundingMetadata.groundingChunks
                .filter(chunk => {
                    if (!chunk.web?.uri) return false;

                    const url = chunk.web.uri.toLowerCase();

                    // Check blacklist first
                    if (blacklistedDomains.some(domain => url.includes(domain))) {
                        console.log(`❌ Rejected blacklisted source: ${url}`);
                        return false;
                    }

                    // Check whitelist
                    const isPalestinian = palestinianDomains.some(domain => url.includes(domain));
                    if (!isPalestinian) {
                        console.log(`⚠️ Rejected non-Palestinian source: ${url}`);
                    }
                    return isPalestinian;
                })
                .map((chunk: any) => ({
                    title: chunk.web.title || 'مصدر قانوني فلسطيني',
                    link: chunk.web.uri,
                    snippet: text.substring(0, 200),
                    source: new URL(chunk.web.uri).hostname
                }));

            console.log(`✅ Found ${sources.length} Palestinian sources via Gemini Grounding`);
            return sources;
        }

        // Fallback: parse response text for URLs (with filtering)
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = text.match(urlRegex) || [];

        return urls
            .filter(url => url.includes('.ps') || url.includes('birzeit.edu'))
            .slice(0, 3)
            .map(url => ({
                title: 'مصدر قانوني فلسطيني',
                link: url,
                snippet: text.substring(0, 200),
                source: new URL(url).hostname
            }));

    } catch (error) {
        console.error('Gemini search error:', error);
        return [];
    }
}
