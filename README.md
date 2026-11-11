# Prism

> **Prism** turns any school textbook topic into an interactive, museum-grade 3D optical lesson explained in **Urdu and English**.

Built for **Build with Google Hackathon** (GDGoC CUI).  
Domain: **Education & Learning** (SDG 4: Quality Education, SDG 10: Reduced Inequalities).  
Builder: **Laiba (Solo)**

---

## 🌟 Overview & Aesthetic

Prism takes textbook topics via typed queries or textbook-page photos, passes them through a structured Google Gemini pipeline, and presents the concepts as interactive 3D simulations paired with clean bilingual explanations, real-time parameter sliders, comprehension quizzes, and a teacher weakness dashboard.

- **Design Philosophy**: High-end museum exhibit aesthetic with pure `#FFFFFF` light canvas, soft pastel materials, and translucent crystal glassmorphism (`backdrop-filter: blur(24px)`).
- **Typography**: Dual-script typography with self-hosted variable **Nunito** for English and **Noto Nastaliq Urdu** with tailored line-height metrics.
- **Responsive**: Phone-first layout with smooth bottom-sheet gestures for mobile (390px) and side-by-side split panels for desktop (1280px+).

---

## 🏛 Architecture & Tech Stack

```
                          ┌───────────────────────────┐
                          │   Frontend (Vite + TS)    │
                          │   Three.js + GSAP + CSS   │
                          └─────────────┬─────────────┘
                                        │ REST (JSON)
                                        ▼
                          ┌───────────────────────────┐
                          │    Backend (FastAPI)      │
                          │ Python 3.12 + Pydantic v2 │
                          └───────┬───────────┬───────┘
                                  │           │
                Google GenAI SDK  │           │  firebase-admin
                                  ▼           ▼
                         ┌─────────────┐ ┌─────────────┐
                         │   Gemini    │ │  Firestore  │
                         │ Flash Model │ │ (Native DB) │
                         └─────────────┘ └─────────────┘
```

| Layer | Technology | Details |
|---|---|---|
| **AI** | **Google Gemini API** | `google-genai` Python SDK for structured lesson JSON generation & textbook vision |
| **Backend** | **FastAPI (Python 3.12)** | Asynchronous endpoints, Pydantic v2 validation, deduplication, in-memory rate limiting |
| **Database** | **Firestore (Spark Plan)** | Managed lesson cache and quiz attempt analytics |
| **Frontend** | **Vite + TypeScript** | Three.js procedural crystal rendering, GSAP animations, Tailwind CSS, `@fontsource` |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm
- Google AI Studio API Key (Gemini)
- Firebase Service Account Key (Firestore Native Mode)

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows PowerShell
   .venv\Scripts\Activate.ps1
   # macOS / Linux
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` file (refer to `.env.example`):
   ```dotenv
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   FIREBASE_PROJECT_ID=your_firebase_project_id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   COLLECTION_PREFIX=dev_
   ALLOWED_ORIGINS=http://localhost:5173
   ```
5. Start the backend development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
6. Check health status at `http://localhost:8000/api/health`.

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` (optional, defaults to `http://localhost:8000`):
   ```dotenv
   VITE_API_BASE_URL=http://localhost:8000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## 📜 API Summary

- `GET /api/health` — Returns system health and integration status (Gemini, Firestore).
- `POST /api/lesson` — Generates or returns cached 3D lesson JSON from `{ "topic": "..." }` or `{ "imageBase64": "...", "mimeType": "..." }`.
- `GET /api/lessons` — Lists recently generated school topics.
- `POST /api/result` — Records a student quiz attempt score.
- `GET /api/stats` — Aggregates per-topic quiz performance for the teacher dashboard.

---

## 🛡️ Responsible AI & Ethical Design
- **Rule R1 Compliance**: Zero fake/mock lessons or placeholder statistics. Every visual renders from verified structured contracts.
- **Rule R5 Transparency**: All generated explanations are visibly labeled as AI-generated and simplified educational models.
- **Rule R6 Privacy**: Textbook photos are processed transiently in memory and never saved to disk or database. Only optional nicknames and scores are stored.
