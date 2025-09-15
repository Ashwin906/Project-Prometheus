# Project Prometheus

An AI-powered multi-agent system for accelerated materials discovery. Prometheus converts a human research goal into structured objectives, retrieves relevant materials data, analyzes Pareto-optimal tradeoffs, and presents optimal candidates with feasibility scoring — all in real time.

## Highlights

- Multi-agent workflow: Epimetheus (Goal Analyst), Athena (Strategist), Hermes (Data Agent), Hephaestus (Pareto Analyst), Cassandra (Feasibility Critic)
- Dual LLM providers: Google Gemini and OpenAI (either works; Gemini recommended)
- Materials Project integration for real-world materials data
- Real-time progress via Server-Sent Events (SSE)
- Interactive UI: agent workflow, logs, Pareto front visualization, best candidate details

## Repository Structure

```
project-prometheus/
  assets/                          # screenshots used in this README
  backend/                         # FastAPI app (agents, SSE, endpoints)
  frontend/
    prometheus/                    # Next.js app (landing, discover, future, contact)
```

## Live Demo (suggested setup)

- Frontend (Vercel): deploy `frontend/prometheus` as a Next.js project
- Backend (Render/Railway): deploy `backend` as a FastAPI app
- Set `NEXT_PUBLIC_API_BASE` in the frontend to the backend URL

## Screenshots

![Landing Page](assets/Screenshot%202025-09-15%20134441.png)

![Discovery Page](assets/Screenshot%202025-09-15%20134335.png)

![Agent Workflow and Logs](assets/Screenshot%202025-09-15%20134347.png)

![Pareto Front Visualization](assets/Screenshot%202025-09-15%20134403.png)

![Future Scope / Vision](assets/Screenshot%202025-09-15%20134518.png)

## Backend (FastAPI)

- Path: `backend/`
- Main app: `backend/main.py`
- Start locally:

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment variables (.env)

```
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
MP_API_KEY=...
DEFAULT_MODEL_PROVIDER=gemini
```

Notes:
- At least one of `OPENAI_API_KEY` or `GOOGLE_API_KEY` is required.
- `MP_API_KEY` is required for live Materials Project data; otherwise, sample data is used.

### Endpoints

- `POST /discover` — starts a discovery session and streams updates over SSE
- `GET /health` — health and configuration status
- `GET /api-config` — environment variable configuration hints (non-sensitive)

## Frontend (Next.js)

- Path: `frontend/prometheus/`
- Start locally:

```
cd frontend/prometheus
npm install
# .env.local
# NEXT_PUBLIC_API_BASE=http://localhost:8000
npm run dev
```

- Pages:
  - `/landing` — mission, problem/solution, agent team
  - `/discover` — configuration + real-time discovery UI
  - `/future` — roadmap and vision
  - `/contact` — elegant contact page

## Deployment

- Backend
  - Render: build `pip install -r backend/requirements.txt`, start `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
  - Railway: start `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Frontend
  - Vercel: root directory `frontend/prometheus`, set `NEXT_PUBLIC_API_BASE` to backend URL

Free tiers are sufficient for demos; note cold starts and monthly caps.

## Development Notes

- Frontend fetches: `${NEXT_PUBLIC_API_BASE}/discover`
- Backend streams via SSE using `sse-starlette`
- Agents orchestrated with LangGraph; LLM integration via LangChain

## License

MIT.
