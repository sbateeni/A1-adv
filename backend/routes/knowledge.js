import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

/**
 * GET /api/knowledge
 * Get all knowledge chunks
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('law_chunks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ chunks: data || [] });
    } catch (error) {
        console.error('Get chunks error:', error);
        res.status(500).json({ error: 'Failed to fetch chunks' });
    }
});

/**
 * POST /api/knowledge
 * Store a new chunk
 */
router.post('/', async (req, res) => {
    try {
        const { content, metadata, embedding } = req.body;

        if (!content || !metadata) {
            return res.status(400).json({ error: 'Content and metadata are required' });
        }

        const { data, error } = await supabase
            .from('law_chunks')
            .insert({
                content,
                metadata,
                embedding
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, chunk: data });
    } catch (error) {
        console.error('Store chunk error:', error);
        res.status(500).json({ error: 'Failed to store chunk' });
    }
});

/**
 * POST /api/knowledge/search
 * Vector similarity search
 */
router.post('/search', async (req, res) => {
    try {
        const { embedding, threshold = 0.75, limit = 3 } = req.body;

        if (!embedding || !Array.isArray(embedding)) {
            return res.status(400).json({ error: 'Valid embedding array is required' });
        }

        const { data, error } = await supabase
            .rpc('match_law_chunks', {
                query_embedding: embedding,
                match_threshold: threshold,
                match_count: limit
            });

        if (error) throw error;

        res.json({ chunks: data || [] });
    } catch (error) {
        console.error('Search chunks error:', error);
        res.status(500).json({ error: 'Failed to search chunks' });
    }
});

/**
 * DELETE /api/knowledge/:id
 * Delete a specific chunk
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('law_chunks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Delete chunk error:', error);
        res.status(500).json({ error: 'Failed to delete chunk' });
    }
});

/**
 * DELETE /api/knowledge/clear/all
 * Clear all chunks
 */
router.delete('/clear/all', async (req, res) => {
    try {
        const { error } = await supabase
            .from('law_chunks')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Clear chunks error:', error);
        res.status(500).json({ error: 'Failed to clear chunks' });
    }
});

export default router;
