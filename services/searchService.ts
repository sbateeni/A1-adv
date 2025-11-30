
import { ApiSource } from '../types';

const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    source: string;
}

export async function searchLegalSources(query: string, apiKey: string, cx: string): Promise<SearchResult[]> {
    if (!apiKey || !cx) {
        console.warn("Search API Key or CX not provided.");
        return [];
    }

    try {
        const url = new URL(GOOGLE_SEARCH_API_URL);
        url.searchParams.append('key', apiKey);
        url.searchParams.append('cx', cx);
        url.searchParams.append('q', query);

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Search API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.items) return [];

        return data.items.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            source: new URL(item.link).hostname
        }));

    } catch (error) {
        console.error("Search failed:", error);
        return [];
    }
}
