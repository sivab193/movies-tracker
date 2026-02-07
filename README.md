# Movies Tracker

A comprehensive movie watch history tracker with leaderboard, admin tools, and privacy controls.

## 🎬 Features

- **Watch History Tracking**: Log movies, theaters, costs, and watch dates
- **TitleCard Timer**: Precisely track when title cards appear
- **Global Leaderboard**: Compete based on total runtime watched
- **Public Profiles**: Share your watch history with privacy controls
- **Admin Dashboard**: Manage users, approve requests, bulk-add movies
- **Google OAuth**: Secure authentication via Firebase

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + **Shadcn UI**
- **Firebase Auth** (Google OAuth)

### Backend
- **Flask** (Python 3.10+)
- **MongoDB Atlas** (Database)
- **Firebase Admin SDK** (Token verification)
- **OMDb API** (Movie data)

---

## 🚀 Deployment to Vercel

### Prerequisites

1. **MongoDB Atlas** account with a cluster
2. **Firebase** project with Google OAuth enabled
3. **OMDb API** key from [omdbapi.com](http://www.omdbapi.com/apikey.aspx)
4. **Vercel** account

### Step 1: Prepare Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Google Sign-In** in Authentication → Sign-in method
4. Add your production domain to authorized domains
5. Download **Service Account Key**:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

### Step 2: Prepare MongoDB

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster (free tier works fine)
3. Create a database user with read/write permissions
4. Whitelist all IPs: `0.0.0.0/0` (Network Access)
5. Get your connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)
6. **Set first admin manually** in MongoDB Compass or Shell:
   ```javascript
   db.users.updateOne(
     {email: "your-email@example.com"},
     {$set: {isAdmin: true}}
   )
   ```

### Step 3: Deploy to Vercel

#### Option A: Via Vercel Web UI

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect the monorepo structure via `vercel.json`
5. **Don't click deploy yet** - add environment variables first

#### Option B: Via CLI

```bash
npm i -g vercel
cd movies-tracker
vercel
```

### Step 4: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

#### Backend Variables

| Variable | Value | Example |
|----------|-------|---------|
| `MONGO_URI` | Your MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/movies_tracker` |
| `OMDB_API_KEY` | Your OMDb API key | `abc12345` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **Entire JSON content** of service account key | `{"type": "service_account", ...}` |

> ⚠️ **Important**: For `FIREBASE_SERVICE_ACCOUNT_KEY`, paste the **entire JSON file content** as a single-line string or multiline text. Vercel will handle it correctly.

#### Frontend Variables

| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase config | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From Firebase config | `your-app.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From Firebase config | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From Firebase config | `your-app.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase config | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase config | `1:123:web:abc` |
| `NEXT_PUBLIC_API_URL` | **Must be** `/api` | `/api` |

> ⚠️ **Critical**: `NEXT_PUBLIC_API_URL` **must** be `/api` in production. The `vercel.json` routing config handles proxying requests to the backend.

### Step 5: Deploy

1. Click "Deploy" or run `vercel --prod`
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployed URL
4. Sign in with Google
5. Manually set admin status for your user in MongoDB

---

## 🛠️ Local Development

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/movies_tracker
OMDB_API_KEY=your_key_here
FIREBASE_SERVICE_ACCOUNT_KEY=backend/serviceAccountKey.json
PORT=8000
```

Run: `python app.py`

### Frontend Setup

```bash
cd ui
npm install
```

Create `ui/.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Run: `npm run dev`

Visit: `http://localhost:3000`

---

## 📁 Project Structure

```
movies-tracker/
├── backend/               # Flask API
│   ├── routes/           # API endpoints
│   │   ├── users.py      # User management
│   │   ├── movies.py     # Movie CRUD, bulk-add
│   │   └── leaderboard.py
│   ├── app.py            # Flask entry point
│   └── requirements.txt
├── ui/                   # Next.js frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── contexts/         # Auth context
│   └── services/         # API client
└── vercel.json           # Deployment config
```

---

## 🔧 Important Configuration Files

### `vercel.json`

Handles monorepo routing:
- `/api/*` → Flask backend
- `/*` → Next.js frontend

**Do not modify** unless you know what you're doing.

### `backend/serviceAccountKey.json`

⚠️ **This file should be in `.gitignore`**. It's your Firebase service account private key. On Vercel, use the environment variable instead.

---

## 🗄️ Database Schema

### Users Collection
```javascript
{
  firebaseUid: string,
  email: string,
  displayName: string,
  photoURL: string,
  isAdmin: boolean,           // Set manually for first admin
  isPublic: boolean,
  totalMoviesWatched: number,
  totalRuntimeSeconds: number,
  watchHistory: [{
    _id: ObjectId,
    movieId: string,
    movieTitle: string,
    theaterName: string,
    theaterLocation: string,
    timestamp: Date,
    ticketCost: number,
    currency: "INR" | "USD"
  }]
}
```

### Movies Collection
```javascript
{
  imdbId: string,
  title: string,
  year: string,
  runtime: string,
  posterUrl: string,
  // ... other OMDb fields
}
```

---

## 🔐 Security Notes

1. **Firebase Rules**: Admin status is managed server-side in MongoDB, not in Firebase Auth
2. **First Admin**: Must be set manually in MongoDB after first sign-in
3. **API Auth**: All protected endpoints verify Firebase ID tokens
4. **Environment Variables**: Never commit `.env` files to Git

---

## 🆘 Troubleshooting

### "403 Forbidden" on admin endpoints
- Ensure your user has `isAdmin: true` in MongoDB users collection

### "Cannot connect to MongoDB"
- Check `MONGO_URI` is correct
- Verify IP whitelist includes `0.0.0.0/0` in MongoDB Atlas

### Firebase auth not working
- Verify all `NEXT_PUBLIC_FIREBASE_*` env vars are set
- Check Firebase console has Google sign-in enabled
- Ensure production domain is in authorized domains

### Backend API calls failing
- In production, `NEXT_PUBLIC_API_URL` **must** be `/api`
- Check Vercel function logs for errors

---

## 📝 License

MIT

## 👨‍💻 Author

Built for tracking movie watch history and competing with friends!
