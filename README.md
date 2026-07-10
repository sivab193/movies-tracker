# 🎬 Movies Tracker

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python 3.10+](https://img.shields.io/badge/Python%203.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask%203.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Firebase Auth](https://img.shields.io/badge/Firebase%20Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Vercel](https://img.shields.io/badge/Deployed%20on%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**A high-performance, full-stack movie watch history tracker, TitleCard timer, and community leaderboard.**  
Built with **Next.js 16 App Router**, **Python Flask**, **MongoDB Atlas**, and **Firebase Google OAuth**.

[Explore API Docs](./docs/API_DOCS.md) · [OpenAPI Spec](./docs/openapi.yaml) · [Architecture Reference](./docs/ARCHITECTURE.md) · [Frontend Guide](./ui/README.md) · [Backend Guide](./backend/README.md)

</div>

---

## ✨ Why Movies Tracker?

Whether you're a cinephile tracking every minute spent in theaters or competing with friends for the annual runtime crown, **Movies Tracker** delivers a rich, responsive, and secure experience:

- **🍿 Comprehensive Watch Logging**: Record movies, verified theaters, ticket costs, currencies (`INR` / `USD`), and optional ticket stub photos.
- **⏱️ TitleCard Precision Timer**: Exactly know when movie title cards appear on screen so you never miss a beat.
- **🏆 Annual Runtime Leaderboard**: Real-time rankings calculated directly from exact runtime seconds (`2026` season).
- **♾️ Infinite Scroll Catalog**: Browse through hundreds of movies with zero UI lag thanks to intersection-observed paginated API endpoints (`20 movies/page`).
- **🛡️ Embedded MongoDB Binary Posters**: Movie posters are downloaded and stored directly inside MongoDB (`movie_posters` collection), guaranteeing permanent availability even if external URLs expire.
- **⚡ Hybrid Vercel Deployment**: Seamlessly bridges a Next.js frontend with a Python serverless API under one unified domain via `vercel.json`.

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph LR
    Client[Browser / PWA] -->|HTTPS + Bearer Token| VercelEdge[Vercel Gateway]
    VercelEdge -->|/*| NextApp[Next.js 16 App Router]
    VercelEdge -->|/api/*| FlaskAPI[Python Flask Serverless API]
    
    subgraph Cloud Infrastructure
        FlaskAPI <-->|Firebase ID Token Verification| FirebaseAuth[Firebase Auth Admin SDK]
        FlaskAPI <-->|PyMongo Document & Binary Storage| Mongo Atlas[(MongoDB Atlas Cluster)]
        FlaskAPI <-->|Metadata & Poster Ingestion| OMDb[OMDb API]
    end
```

For detailed sequence diagrams of request lifecycles and storage topologies, see **[Architecture Guide](./docs/ARCHITECTURE.md)**.

---

## 📚 Quick Navigation & Documentation

| Document | Description |
| :--- | :--- |
| **[REST API Reference](./docs/API_DOCS.md)** | Complete documentation of all endpoints, authentication headers, schemas, and status codes. |
| **[OpenAPI 3.0 Specification](./docs/openapi.yaml)** | Standard OpenAPI / Swagger definition ready for Postman or Redoc import. |
| **[Backend Engineering Guide](./backend/README.md)** | Flask environment setup, CLI utility documentation (`bulk_import.py`, `bulk_watch.py`), and routes. |
| **[Frontend Engineering Guide](./ui/README.md)** | Next.js 16 setup, Tailwind v4 styling, component hierarchy, and build verification. |

---

## 🚀 Quick Start Guide (Local Development)

### Prerequisites
- **Node.js 20+** and **npm**
- **Python 3.10+** and **pip**
- **MongoDB Atlas** connection URI (`mongodb+srv://...`)
- **Firebase** project with Google OAuth enabled and `serviceAccountKey.json` downloaded
- **OMDb API Key** from [omdbapi.com](http://www.omdbapi.com/apikey.aspx)

### 1. Start Python Backend API (`localhost:8000`)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env inside backend/
cat <<EOT >> .env
MONGO_URI=mongodb://localhost:27017/movies_tracker
OMDB_API_KEY=your_key_here
FIREBASE_SERVICE_ACCOUNT_KEY=backend/serviceAccountKey.json
PORT=8000
EOT

python3 app.py
```

### 2. Start Next.js Frontend (`localhost:3000`)
```bash
cd ../ui
npm install

# Create .env.local inside ui/
cat <<EOT >> .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8000/api
EOT

npm run dev
```

Visit `http://localhost:3000` to log in via Google OAuth and start logging movies!

---

## 🛠️ CLI Bulk Import & Database Tools

Our backend includes dedicated high-performance CLI utilities for batch seeding and data management:

| Utility Script | Purpose | Command Example |
| :--- | :--- | :--- |
| `backend/scripts/bulk_import.py` | Import movies & binary posters from OMDb or Kaggle CSV | `cd backend && python3 scripts/bulk_import.py --file movies.txt` |
| `backend/scripts/bulk_delete_no_poster.py` | Audit & clean up movies missing binary posters | `cd backend && python3 scripts/bulk_delete_no_poster.py --execute` |
| `backend/scripts/bulk_theaters.py` | Batch seed approved movie theaters without duplicates | `cd backend && python3 scripts/bulk_theaters.py --file theaters.txt` |
| `backend/scripts/bulk_watch.py` | Batch ingest user watch history from CSV logs | `cd backend && python3 scripts/bulk_watch.py --uid <user_uid> --csv watch_history.csv` |

---

## ☁️ Production Deployment (Vercel)

Movies Tracker is designed out of the box for zero-config deployment on **Vercel** using `vercel.json` monorepo routing.

### Environment Variables for Vercel
In your Vercel Dashboard → Project Settings → Environment Variables, configure:

| Variable Name | Value Description |
| :--- | :--- |
| `MONGO_URI` | MongoDB Atlas Production Cluster Connection String |
| `OMDB_API_KEY` | Your OMDb API Key |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **Paste the entire raw JSON string** of `serviceAccountKey.json` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain (`project.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket (`project.appspot.com`) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_API_URL` | **Must exactly be `/api`** (triggers `vercel.json` reverse proxy) |

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to fork, customize, and deploy your own movie tracking portal!

## 👨‍💻 Connect

Built by **Siva B**.  
Check out more on [LinkedIn](https://linkedin.com) or explore the code right here!
