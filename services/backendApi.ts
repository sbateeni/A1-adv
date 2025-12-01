/**
 * Backend API Service
 * Communicates with the Node.js backend for shared resources
 */

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    source: string;
}

export interface LawChunk {
    id?: string;
    content: string;
    metadata: {
        source_url: string;
        law_name: string;
        date_fetched: string;
        content_type?: 'full' | 'snippet';
    };
    embedding?: number[];
}

/**
 * Search the web using Gemini with Google Search Grounding (via backend)
 * User's Gemini API key is sent to backend for search
 */
export async function searchWeb(query: string, geminiApiKey: string): Promise<SearchResult[]> {
    try {
        const response = await fetch(`${API_URL}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, geminiApiKey })
        });

        if (!response.ok) {
            throw new Error(`Backend search failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Backend search error:', error);
        return [];
    }
}

/**
 * Get all knowledge chunks from Supabase (via backend)
 */
export async function getAllKnowledgeChunks(): Promise<LawChunk[]> {
    try {
        const response = await fetch(`${API_URL}/api/knowledge`);

        if (!response.ok) {
            throw new Error(`Failed to fetch chunks: ${response.statusText}`);
        }

        const data = await response.json();
        return data.chunks || [];
    } catch (error) {
        console.error('Get chunks error:', error);
        return [];
    }
}

/**
 * Store a chunk in Supabase (via backend)
 */
export async function storeKnowledgeChunk(chunk: LawChunk): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/knowledge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk)
        });

        if (!response.ok) {
            throw new Error(`Failed to store chunk: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Store chunk error:', error);
        return false;
    }
}

/**
 * Search knowledge base using vector similarity (via backend)
 */
export async function searchKnowledgeChunks(
    embedding: number[],
    threshold: number = 0.75,
    limit: number = 3
): Promise<LawChunk[]> {
    try {
        const response = await fetch(`${API_URL}/api/knowledge/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embedding, threshold, limit })
        });

        if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.chunks || [];
    } catch (error) {
        console.error('Search chunks error:', error);
        return [];
    }
}

/**
 * Delete a specific chunk (via backend)
 */
export async function deleteKnowledgeChunk(id: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/knowledge/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Delete failed: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Delete chunk error:', error);
        return false;
    }
}

/**
 * Clear all chunks (via backend)
 */
export async function clearAllKnowledgeChunks(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/knowledge/clear/all`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Clear failed: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Clear chunks error:', error);
        return false;
    }
}
