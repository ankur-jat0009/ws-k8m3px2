# WindScope — Assignment Submission Checklist

**Project**: WindScope — UK Wind Forecast Intelligence  
**Evaluation Target**: January 2026 Day-Ahead Procurement Decisions  
**Candidate Submission**: Full-Stack SWE Challenge

---

### Core Engineering & Implementation
- [x] **Frontend implemented**: React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Recharts.
- [x] **Backend implemented**: Python 3.12, FastAPI, Pydantic, pandas, numpy, httpx.
- [x] **Real Elexon integration tested**: Successfully queries official `FUELHH/stream` and `WINDFOR/stream` endpoints.
- [x] **January 2026 data retrieved**: 1,488 actual wind settlement periods and 19,856 forecast records across 272 vintages verified and cached locally.
- [x] **Forecast cutoff logic tested**: Forecasts strictly filtered to $publishTime \le cutoff$ with zero lookahead leak; default cutoff set to GB Day-Ahead gate closure (12:00 London Time D-1).
- [x] **Accuracy metrics verified**: MAE, RMSE, Signed Bias, WAPE, and MAPE (with zero-division protection) verified against formulas.
- [x] **Timezone and DST handling tested**: `Europe/London` calendar rules verified; standard 48, spring 46, and autumn 50 settlement periods covered in unit tests.
- [x] **Frontend tests executed**: Vitest component test suite executed (4 of 4 tests passing).
- [x] **Backend tests executed**: Pytest test suite executed (27 of 27 tests passing).
- [x] **Docker configuration verified**: Root `docker-compose.yml`, `backend/Dockerfile`, and `frontend/Dockerfile` verified.

---

### Cloud Hosting, Version Control & Presentation Status
- [x] **Public GitHub repository prepared**: Anonymous repository created and pushed cleanly with no personal names or secrets.
- [x] **Production deployment configured**: `vercel.json` and `render.yaml` created and configured.
- [ ] **Live production deployment**: Deployment configuration prepared; awaiting live cloud provider account provisioning / authorization.
- [ ] **Live URLs verified in incognito session**: Subject to live cloud deployment completion.
- [x] **README completed**: Exhaustive documentation covering all 25 required sections.
- [x] **AI disclosure included**: Explicit disclosure of AI assistance, models used, and specific contributions included in README.
- [x] **Demo scripts prepared**: Complete 10-minute 2-part presentation script with exact visual timings (`docs/demo-script.md`).
- [ ] **Demo video recorded**: Prepared for manual recording using provided script.
- [ ] **Video uploaded as unlisted**: Manual recording/upload step.
- [ ] **Video link verified**: Manual verification step once uploaded.
- [ ] **Submission form completed**: "Full Stack SWE challenge submission v4 – Fill out form" ready for manual completion with repository link and video link.
