
import { searchLegalSources, SearchResult } from './searchService';
import { storeLawChunk, LawChunk } from './knowledgeBaseService';
import * as dbService from './dbService';

export interface HybridContext {
    text: string;
    sources: SearchResult[];
}

export async function performHybridSearch(query: string): Promise<HybridContext | null> {
    // 1. Load Keys
    const apiKey = await dbService.getSetting<string>('googleSearchApiKey');
    const cx = await dbService.getSetting<string>('googleSearchCx');

    if (!apiKey || !cx) return null;

    console.log("Starting Hybrid Search for:", query);

    // 2. Perform Web Search (The "Learning" Step)
    // In a full implementation, we would check the Vector DB first.
    // For this "Lazy" prototype, we search web first to populate the DB.
    const searchResults = await searchLegalSources(query, apiKey, cx);

    if (searchResults.length === 0) return null;

    // 3. Background: Ingest into Knowledge Base (Lazy Caching)
    // We don't await this to keep the UI snappy
    Promise.all(searchResults.map(async (result) => {
        const chunk: LawChunk = {
            content: result.snippet, // In real app, we would scrape the full page content here
            metadata: {
                source_url: result.link,
                law_name: result.title,
                date_fetched: new Date().toISOString()
            }
        };
        await storeLawChunk(chunk);
    })).catch(err => console.error("Background ingestion failed:", err));

    // 4. Format Context for Gemini
    const contextText = searchResults.map((r, i) =>
        `[Source ${i + 1}]: ${r.title} (${r.source})\nSnippet: ${r.snippet}\nLink: ${r.link}`
    ).join('\n\n');

    return {
        text: `\n\n--- معلومات قانونية موثقة (نتائج بحث حية) ---\nاستخدم المعلومات التالية للإجابة بدقة، مع ذكر المصدر:\n${contextText}\n-----------------------------------------------\n`,
        sources: searchResults
    };
}
