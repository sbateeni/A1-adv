
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Interface for a Law Chunk
export interface LawChunk {
    id?: string;
    content: string;
    metadata: {
        source_url: string;
        law_name: string;
        date_fetched: string;
    };
    embedding?: number[]; // Vector embedding
}

let supabase: SupabaseClient | null = null;

export const initSupabase = (url: string, key: string) => {
    if (url && key) {
        supabase = createClient(url, key);
    }
};

export const getSupabaseClient = () => supabase;

// 1. Store a new Law Chunk (Lazy Learning)
export async function storeLawChunk(chunk: LawChunk): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('law_chunks')
        .insert({
            content: chunk.content,
            metadata: chunk.metadata,
            embedding: chunk.embedding // Requires pgvector setup
        });

    if (error) {
        console.error("Error storing chunk:", error);
        return false;
    }
    return true;
}

// 2. Search for relevant laws (The Memory)
export async function searchKnowledgeBase(queryEmbedding: number[], threshold = 0.7, limit = 5): Promise<LawChunk[]> {
    if (!supabase) return [];

    // RPC call to a postgres function 'match_law_chunks'
    const { data, error } = await supabase
        .rpc('match_law_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: limit,
        });

    if (error) {
        console.error("Error searching KB:", error);
        return [];
    }

    return data as LawChunk[];
}
