# Disclosure

## AI tools
- **Claude Code** (AI coding assistant used for the scroll-controlled image background)
- **Antigravity** (AI coding assistant used during development)
- **Google Gemini API** (`google-genai` SDK — runtime educational lesson & textbook vision pipeline)

## Tech
- **Google Cloud / Firebase**: Firestore (Native mode, Spark plan), Firebase Hosting
- **Backend**: Python 3.12, FastAPI, Pydantic v2, httpx, Uvicorn
- **Frontend**: Vite, TypeScript, Three.js (MIT), GSAP (Standard "No Charge" GreenSock License), Tailwind CSS (MIT), `simplex-noise` (MIT)

## Assets and licenses
- **Prism scroll sequence** (`assets/ezgif-5850b78a2b02ac3f-jpg/`): 35 user-supplied JPEG frames used as decorative landing-page footage, not as a lesson simulation. Original source and license are awaiting the asset owner's confirmation before public distribution.
- **Nunito Variable** (`@fontsource-variable/nunito`): SIL Open Font License 1.1 (OFL-1.1), self-hosted
- **Noto Nastaliq Urdu** (`@fontsource/noto-nastaliq-urdu`): SIL Open Font License 1.1 (OFL-1.1), self-hosted
- **Three.js `RoomEnvironment`**: Built-in procedural studio lighting environment from `three/examples/jsm/environments/RoomEnvironment.js` (MIT)
- **SVG Icons & Optical Prism Illustrations**: Original inline vector graphics authored in-repo

## Notes
- No mock lessons, seed datasets, or dummy analytics rows are bundled in the application.
- Student textbook photos are resized client-side and processed in memory only; images are never stored on disk or in Firestore.
