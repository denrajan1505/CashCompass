# CashCompass — Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- A virtual environment at `Five_Pillar/venv/`

---

## 1. Database

```sql
CREATE DATABASE cashcompass;
```

---

## 2. Backend

```powershell
cd C:\Users\denra\Desktop\Five_Pillar\CashCompass\backend
..\..\..\venv\Scripts\activate        # or create a new venv here
pip install -r requirements.txt
copy .env.example .env                # fill in your keys
python main.py                        # runs on http://localhost:8000
```

API docs: http://localhost:8000/api/docs

---

## 3. Frontend

```powershell
cd C:\Users\denra\Desktop\Five_Pillar\CashCompass\frontend
npm install
npm run dev                           # runs on http://localhost:5173
```

---

## 4. Keys needed in backend/.env

| Key | Where to get |
|-----|-------------|
| `OPENAI_API_KEY` | platform.openai.com |
| `GEMINI_API_KEY` | aistudio.google.com |
| `SARVAM_API_KEY` | app.sarvam.ai |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | AWS S3 or Cloudflare R2 |
| `DODO_API_KEY` | dodopayments.com |
| `EXCHANGE_RATE_API_KEY` | exchangerate-api.com |
| `SMTP_USER` + `SMTP_PASSWORD` | Gmail app password |

---

## 5. Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel (`npm run build` → deploy `dist/`) |
| Backend | Railway / Render (`python main.py`) |
| Database | Railway PostgreSQL / Supabase |
| Storage | AWS S3 / Cloudflare R2 |

---

## 30-Day MVP Roadmap

| Week | Focus |
|------|-------|
| Week 1 | Backend auth + expenses CRUD + DB schema |
| Week 2 | Frontend dashboard + expense list + budgets |
| Week 3 | AI chat + receipt scanner + voice entry |
| Week 4 | Payments (Dodo) + analytics + deploy |
