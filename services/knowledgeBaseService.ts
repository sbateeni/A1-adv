
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../pages/geminiService';

// Interface for a Law Chunk
export interface LawChunk {
    id?: string;
    content: string;
    metadata: {
        source_url: string;
        law_name: string;
        date_fetched: string;
        content_type?: 'full' | 'snippet'; // Track if we have full content or just snippet
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

    // Generate embedding if missing
    if (!chunk.embedding) {
        console.log("Generating embedding for chunk...");
        chunk.embedding = await generateEmbedding(chunk.content);
    }

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
export async function searchKnowledgeBase(query: string, threshold = 0.7, limit = 5): Promise<LawChunk[]> {
    if (!supabase) return [];

    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding || queryEmbedding.length === 0) return [];

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

// 3. Get all chunks (for UI display)
export async function getAllChunks(): Promise<LawChunk[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('law_chunks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching all chunks:", error);
        return [];
    }

    return data as LawChunk[];
}

// 4. Delete a specific chunk
export async function deleteChunk(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('law_chunks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting chunk:", error);
        return false;
    }

    console.log(`🗑️ Deleted chunk: ${id}`);
    return true;
}

// 5. Clear all chunks
export async function clearAllChunks(): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('law_chunks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (workaround for "delete all")

    if (error) {
        console.error("Error clearing knowledge base:", error);
        return false;
    }

    console.log(`🧹 Cleared all chunks from knowledge base`);
    return true;
}

// 6. Update chunk content
export async function updateChunk(id: string, newContent: string): Promise<boolean> {
    if (!supabase) return false;

    // Generate new embedding for updated content
    const newEmbedding = await generateEmbedding(newContent);

    const { error } = await supabase
        .from('law_chunks')
        .update({
            content: newContent,
            embedding: newEmbedding,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error("Error updating chunk:", error);
        return false;
    }

    console.log(`✏️ Updated chunk: ${id}`);
    return true;
}
