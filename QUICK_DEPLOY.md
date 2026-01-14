# Quick Deployment Guide

## 🚀 Quick Start

### Backend (Railway) - 5 minutes

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo
3. Add PostgreSQL: New → Database → Add PostgreSQL
4. Set environment variables:
   ```
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   ```
5. Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

### Frontend (Vercel) - 5 minutes

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import your GitHub repo
3. Configure:
   - Root Directory: `frontend`
   - Build Command: `npx expo export:web`
   - Output Directory: `web-build`
4. Add environment variables:
   ```
   EXPO_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api/seniorsmartassist
   EXPO_PUBLIC_SOCKET_URL=https://your-railway-app.up.railway.app
   ```
5. Deploy and copy your Vercel URL

### Final Step

Update Railway `CORS_ORIGINS` with your Vercel URL:
```
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

## ✅ Done!

Your app is now live! Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting.
