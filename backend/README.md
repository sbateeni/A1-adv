# Palestinian Legal Advisor - Backend

Backend API server for the Palestinian Legal Advisor application. Handles shared resources like Google Search and Supabase operations.

## Features

- 🔍 **Google Custom Search API** - Centralized search for all users
- 📚 **Supabase Knowledge Base** - Shared vector database
- 🛡️ **Rate Limiting** - 100 requests per 15 minutes
- 🔒 **CORS Protection** - Secure cross-origin requests

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
```env
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_CX=your_search_engine_id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 3. Run Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```

### Search
```
POST /api/search
Body: { "query": "ما هو قانون العمل؟" }
```

### Knowledge Base

**Get all chunks:**
```
GET /api/knowledge
```

**Store chunk:**
```
POST /api/knowledge
Body: { "content": "...", "metadata": {...}, "embedding": [...] }
```

**Search chunks:**
```
POST /api/knowledge/search
Body: { "embedding": [...], "threshold": 0.75, "limit": 3 }
```

**Delete chunk:**
```
DELETE /api/knowledge/:id
```

**Clear all:**
```
DELETE /api/knowledge/clear/all
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Add environment variables in Vercel dashboard

### Railway

1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

### Render

1. Create new Web Service
2. Connect GitHub repo
3. Add environment variables
4. Deploy

## Security

- ✅ Rate limiting enabled
- ✅ CORS configured
- ✅ Environment variables for secrets
- ✅ Input validation

## License

MIT
