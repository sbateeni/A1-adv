
/**
 * Jina Reader Service
 * Fetches full webpage content as clean Markdown using Jina AI's free Reader API
 */

const JINA_READER_BASE_URL = 'https://r.jina.ai/';

export interface JinaReaderResult {
    content: string;
    title?: string;
    url: string;
}

/**
 * Fetch full content from a URL using Jina Reader
 * @param url - The URL to fetch content from
 * @returns Clean Markdown content or null if failed
 */
export async function fetchFullContent(url: string): Promise<string | null> {
    if (!url || !url.startsWith('http')) {
        console.warn('Invalid URL provided to Jina Reader:', url);
        return null;
    }

    try {
        console.log('📄 Fetching full content from Jina Reader:', url);

        const jinaUrl = `${JINA_READER_BASE_URL}${encodeURIComponent(url)}`;
        const response = await fetch(jinaUrl, {
            headers: {
                'Accept': 'text/plain',
                'X-Return-Format': 'markdown'
            }
        });

        if (!response.ok) {
            console.error(`Jina Reader API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const content = await response.text();

        if (!content || content.trim().length === 0) {
            console.warn('Jina Reader returned empty content for:', url);
            return null;
        }

        console.log(`✅ Fetched ${content.length} characters from Jina Reader`);
        return content;

    } catch (error) {
        console.error('Error fetching content from Jina Reader:', error);
        return null;
    }
}

/**
 * Fetch full content with retry logic
 * @param url - The URL to fetch
 * @param maxRetries - Maximum number of retries (default: 2)
 * @returns Content or null
 */
export async function fetchFullContentWithRetry(
    url: string,
    maxRetries: number = 2
): Promise<string | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const content = await fetchFullContent(url);
        if (content) return content;

        if (attempt < maxRetries) {
            console.log(`Retrying Jina Reader (${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
    }

    console.warn(`Failed to fetch content after ${maxRetries + 1} attempts`);
    return null;
}
