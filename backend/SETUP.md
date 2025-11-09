# Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Google Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
BACKEND_PORT=3001
```

### 3. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new API key or use an existing one
4. Copy the API key and paste it into your `.env` file

### 4. Run the Server

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

### 5. Verify It's Working

Open your browser and go to:
- **Health Check**: http://localhost:3001/api/health
- **API Docs**: http://localhost:3001/docs

You should see the API documentation and health status.

## Troubleshooting

### Error: "Your default credentials were not found"

This means the `GEMINI_API_KEY` is not set or not being read correctly.

**Solution:**

1. Make sure you created the `.env` file in the `backend/` directory
2. Verify the API key is correct (no extra spaces or quotes)
3. Try running with the environment variable directly:

```bash
# On Mac/Linux
export GEMINI_API_KEY=your_key_here
python main.py

# On Windows (PowerShell)
$env:GEMINI_API_KEY="your_key_here"
python main.py

# On Windows (CMD)
set GEMINI_API_KEY=your_key_here
python main.py
```

### Error: "Module not found"

Make sure you installed all dependencies:

```bash
pip install -r requirements.txt
```

### Port Already in Use

If port 3001 is already in use, change it in `.env`:

```env
BACKEND_PORT=3002
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key for LLM |
| `BACKEND_PORT` | No | Port for backend server (default: 3001) |
| `MAPBOX_ACCESS_TOKEN` | No | Mapbox token for enhanced features |
| `CENSUS_API_KEY` | No | US Census API key |
| `EPA_API_KEY` | No | EPA Air Quality API key |
| `HUD_API_KEY` | No | HUD Housing API key |

## Test the API

Once running, test with curl:

```bash
# Health check
curl http://localhost:3001/api/health

# Get agent types
curl http://localhost:3001/api/agent-types

# Execute an agent (simple test)
curl -X POST http://localhost:3001/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "CONSULTING",
    "description": "Test consultation",
    "stream": false
  }'
```

## Next Steps

1. Start the frontend: `cd frontend && npm run dev`
2. Go to http://localhost:5173/workflow
3. Try the complete workflow!

## Support

If you're still having issues:
1. Check the backend logs for detailed error messages
2. Verify your Python version (requires 3.11+)
3. Make sure all dependencies installed correctly
4. Try restarting the server after changing `.env`



