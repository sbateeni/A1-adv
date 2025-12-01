import express from 'express';

const router = express.Router();

const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

/**
 * POST /api/search
 * Search legal sources using Google Custom Search
 */
router.post('/', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query is required' });
        }

        const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
        const cx = process.env.GOOGLE_SEARCH_CX;

        if (!apiKey || !cx) {
            return res.status(500).json({
                error: 'Google Search API not configured on server'
            });
        }

        const url = new URL(GOOGLE_SEARCH_API_URL);
        url.searchParams.append('key', apiKey);
        url.searchParams.append('cx', cx);
        url.searchParams.append('q', query);

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Google Search API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.items) {
            return res.json({ results: [] });
        }

        const results = data.items.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            source: new URL(item.link).hostname
        }));

        res.json({ results });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'Search failed',
            message: error.message
        });
    }
});

export default router;
