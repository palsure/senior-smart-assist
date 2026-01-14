# Deployment Guide

This guide explains how to deploy the SeniorSmartAssist application to Vercel (frontend) and Railway (backend).

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Railway Account**: Sign up at [railway.app](https://railway.app)
3. **GitHub Repository**: Your code should be pushed to GitHub

## Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will detect the `backend` directory automatically

### Step 2: Add PostgreSQL Database

1. In Railway dashboard, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a PostgreSQL database
3. The `DATABASE_URL` environment variable will be automatically set

### Step 3: Configure Environment Variables

In Railway dashboard, go to your service → Variables tab and add:

```
PORT=5000
FLASK_ENV=production
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

**Note**: 
- `DATABASE_URL` is automatically provided by Railway when you add PostgreSQL
- Replace `your-vercel-app` with your actual Vercel deployment URL (you can update this after frontend deployment)

### Step 4: Configure Build Settings

Railway should automatically detect:
- **Root Directory**: `backend` (set this in Settings → Service → Root Directory)
- **Build Command**: Automatically handled by nixpacks.toml
- **Start Command**: `python run.py` (from Procfile)

If Railway doesn't detect automatically:
1. Go to Settings → Service
2. Set **Root Directory** to `backend`
3. Railway will use the `nixpacks.toml` and `Procfile` for build/start commands

### Step 5: Deploy

Railway will automatically deploy when you push to your main branch. You can also trigger a manual deploy from the dashboard.

### Step 6: Get Your Backend URL

After deployment, Railway will provide a public URL like:
```
https://your-app-name.up.railway.app
```

**Save this URL** - you'll need it for the frontend configuration.

---

## Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### Step 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npx expo export:web`
   - **Output Directory**: `web-build`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

In Vercel dashboard, go to your project → Settings → Environment Variables and add:

```
EXPO_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api/seniorsmartassist
EXPO_PUBLIC_SOCKET_URL=https://your-railway-app.up.railway.app
```

**Important**: Replace `your-railway-app.up.railway.app` with your actual Railway backend URL.

### Step 4: Deploy

Vercel will automatically deploy when you push to your main branch. You can also trigger a manual deploy.

### Step 6: Update Backend CORS

After getting your Vercel URL, update the Railway environment variable:

```
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

---

## Post-Deployment Checklist

- [ ] Backend is accessible at Railway URL
- [ ] Frontend is accessible at Vercel URL
- [ ] Environment variables are set correctly
- [ ] CORS is configured to allow Vercel domain
- [ ] Database is initialized (Railway will create PostgreSQL automatically)
- [ ] WebSocket connections work (check browser console)

## Troubleshooting

### Backend Issues

1. **Database Connection Error**: Ensure `DATABASE_URL` is set in Railway
2. **Port Issues**: Railway provides `PORT` environment variable automatically
3. **CORS Errors**: Make sure `CORS_ORIGINS` includes your Vercel URL

### Frontend Issues

1. **API Connection Error**: Verify `EXPO_PUBLIC_API_URL` is set correctly
2. **Socket Connection Error**: Verify `EXPO_PUBLIC_SOCKET_URL` is set correctly
3. **Build Errors**: Check that all dependencies are in `package.json`

### WebSocket Issues

If WebSocket connections fail:
1. Railway may require WebSocket support - check Railway plan
2. Verify CORS settings allow WebSocket connections
3. Check browser console for connection errors

## Local Development After Deployment

For local development, you can still use:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:19006`

The environment variables will only be used in production (Vercel/Railway).

## Updating Deployments

Both platforms support automatic deployments:
- **Railway**: Deploys on push to main branch
- **Vercel**: Deploys on push to main branch

To update:
1. Make changes locally
2. Commit and push to GitHub
3. Deployments will trigger automatically
