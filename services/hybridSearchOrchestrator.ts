
import { searchWeb, storeKnowledgeChunk, searchKnowledgeChunks } from './backendApi';
import { fetchFullContent } from './jinaReaderService';
import { generateEmbedding } from '../pages/geminiService';

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    source: string;
}

export interface HybridContext {
    text: string;
    sources: SearchResult[];
}

export async function performHybridSearch(query: string): Promise<HybridContext | null> {
    console.log("🔍 Starting Hybrid Search for:", query);

    // 1. Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Search Memory First (via Backend → Supabase)
    const memoryResults = await searchKnowledgeChunks(queryEmbedding, 0.75, 3);
    console.log(`💾 Found ${memoryResults.length} results in memory`);

    // Convert memory results to SearchResult format
    let allSources: SearchResult[] = memoryResults.map(chunk => ({
        title: chunk.metadata.law_name || 'مصدر قانوني',
        link: chunk.metadata.source_url || '',
        snippet: chunk.content.substring(0, 200) + '...', // Show preview
        source: chunk.metadata.source_url ? new URL(chunk.metadata.source_url).hostname : 'memory'
    }));

    // 3. Decide if we need web search
    const needsWebSearch = memoryResults.length < 2;

    if (needsWebSearch) {
        console.log("🌐 Searching web for additional context...");

        // Search via backend (no API keys needed on client)
        const webResults = await searchWeb(query);

        if (webResults.length > 0) {
            // Deduplicate by URL
            const existingUrls = new Set(allSources.map(s => s.link).filter(Boolean));
            const newWebResults = webResults.filter(r => !existingUrls.has(r.link));

            // Merge results
            allSources = [...allSources, ...newWebResults];

            // Store new results in background with full content
            if (newWebResults.length > 0) {
                storeWebResultsWithFullContent(newWebResults).catch(err =>
                    console.error("❌ Background ingestion failed:", err)
                );

                console.log(`💾 Storing ${newWebResults.length} new chunks (fetching full content in background)`);
            }
        }
    } else {
        console.log("✅ Using memory results only (no web search needed)");
    }

    // 4. Return formatted context
    if (allSources.length === 0) {
        console.log("⚠️ No results found");
        return null;
    }

    return formatContext(allSources);
}

/**
 * Store web results with full content fetched via Jina Reader
 */
async function storeWebResultsWithFullContent(results: SearchResult[]): Promise<void> {
    for (const result of results) {
        try {
            // Fetch full content using Jina Reader
            const fullContent = await fetchFullContent(result.link);

            // Generate embedding for the content
            const content = fullContent || result.snippet;
            const embedding = await generateEmbedding(content);

            const chunk = {
                content,
                metadata: {
                    source_url: result.link,
                    law_name: result.title,
                    date_fetched: new Date().toISOString(),
                    content_type: (fullContent ? 'full' : 'snippet') as 'full' | 'snippet'
                },
                embedding
            };

            // Store via backend
            await storeKnowledgeChunk(chunk);

            if (fullContent) {
                console.log(`✅ Stored full content (${fullContent.length} chars) for: ${result.title}`);
            } else {
                console.log(`⚠️ Stored snippet only for: ${result.title}`);
            }
        } catch (error) {
            console.error(`Failed to store chunk for ${result.link}:`, error);
        }
    }
}

function formatContext(sources: SearchResult[]): HybridContext {
    const contextText = sources.map((r, i) =>
        `[Source ${i + 1}]: ${r.title} (${r.source})\nSnippet: ${r.snippet}\nLink: ${r.link}`
    ).join('\n\n');

    return {
        text: `\n\n--- معلومات قانونية موثقة ---\nاستخدم المعلومات التالية للإجابة بدقة، مع ذكر المصدر:\n${contextText}\n-----------------------------------------------\n`,
        sources: sources
    };
}
