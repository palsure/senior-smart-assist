# Railway Setup Instructions

## Fixing the "Railpack could not determine how to build" Error

If you're seeing this error, follow these steps:

### Step 1: Verify Root Directory

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** → **Service**
4. Make sure **Root Directory** is set to: `backend`
5. Save changes

### Step 2: Verify Files Are Present

Ensure these files exist in the `backend/` directory:
- ✅ `requirements.txt` (Python dependencies)
- ✅ `Procfile` (start command: `web: python run.py`)
- ✅ `run.py` (main entry point)
- ✅ `start.sh` (backup start script)

### Step 3: Force Rebuild

1. In Railway dashboard, go to your service
2. Click on **Deployments** tab
3. Click **Redeploy** or trigger a new deployment
4. Railway should now detect Python from `requirements.txt`

### Step 4: Check Build Logs

If it still fails:
1. Check the build logs in Railway
2. Look for Python detection messages
3. Verify `requirements.txt` is being read

### Alternative: Use Nixpacks Explicitly

If Railpack continues to fail, you can force Nixpacks:

1. In Railway dashboard → Settings → Service
2. Under **Build & Deploy**, set:
   - **Builder**: `NIXPACKS`
   - **Start Command**: `python run.py`

### Manual Build Command (if needed)

If auto-detection fails, you can set manually:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python run.py`

## Common Issues

### Issue: "Script start.sh not found"
**Solution**: The `start.sh` file should be in the `backend/` directory. Make sure Root Directory is set to `backend`.

### Issue: "Could not determine how to build"
**Solution**: 
1. Verify `requirements.txt` exists and has valid Python packages
2. Set Root Directory to `backend`
3. Ensure `Procfile` exists with `web: python run.py`

### Issue: Python version mismatch
**Solution**: The `runtime.txt` file specifies Python 3.11. Railway should auto-detect this.

## Verification Checklist

- [ ] Root Directory set to `backend`
- [ ] `requirements.txt` exists and is valid
- [ ] `Procfile` exists with `web: python run.py`
- [ ] `run.py` exists and is executable
- [ ] `start.sh` exists (backup)
- [ ] PostgreSQL database is added
- [ ] Environment variables are set
