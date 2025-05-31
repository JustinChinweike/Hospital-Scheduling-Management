
# 🚀 Railway Deployment Guide

## Complete Assignment 4 & 5 Requirements ✅

### Assignment 4 (Deployment) - All Tiers Complete:
- ✅ **Bronze**: Backend deployed (Express.js + PostgreSQL)
- ✅ **Silver**: Frontend + Backend deployed 
- ✅ **Gold**: Docker Compose automation ready

### Assignment 5 (Authentication & Security) - All Tiers Complete:
- ✅ **Bronze**: HTTPS enabled (automatic on Railway)
- ✅ **Silver**: JWT authentication + user sessions
- ✅ **Gold**: Two-Factor Authentication (2FA) implemented

## 🚂 Railway Deployment Steps

### 1. Prepare GitHub Repository
```bash
# Make sure all files are committed
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Deploy Backend on Railway

1. **Go to [railway.app](https://railway.app) and sign in with GitHub**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your hospital-scheduler repository
   - Select "Deploy from a folder" → `backend`

3. **Add PostgreSQL Database**
   - In your project dashboard, click "New Service"
   - Select "PostgreSQL"
   - Railway will automatically provision a database

4. **Configure Backend Environment Variables**
   - Go to your backend service → "Variables" tab
   - Add these variables:
   ```
   NODE_ENV=production
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   JWT_SECRET=hDk7S9mLpQ2xR5vT8nY3zX6cB1aE4gF0jW3pL7dK9sM
   PORT=5000
   ```

5. **Get Backend URL**
   - Once deployed, copy the backend URL (e.g., `https://your-backend.railway.app`)

### 3. Deploy Frontend on Railway

1. **Create Another Service**
   - In the same project, click "New Service"
   - Select "Deploy from GitHub repo" 
   - Choose your repository again
   - This time deploy from root folder (not backend folder)

2. **Configure Frontend Environment**
   - Go to frontend service → "Variables" tab
   - Add:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

3. **Set Build Command**
   - Go to "Settings" → "Build"
   - Build Command: `npm run build`
   - Start Command: `npm run preview`

### 4. Seed Database (Optional)
After deployment, you can seed the database by running:
```bash
# Connect to your backend service and run
npm run seed
```

## 🔗 Expected URLs
- **Frontend**: `https://your-frontend.railway.app`
- **Backend API**: `https://your-backend.railway.app`
- **Database**: Internal Railway connection

## 🔐 Default Login Credentials
- **Admin**: admin@example.com / password
- **User**: user@example.com / password

## ✨ Features Deployed
- User Authentication (JWT)
- Two-Factor Authentication (2FA)
- Schedule Management (CRUD)
- Admin Dashboard
- Real-time Updates
- Responsive Design
- HTTPS Security

## 🐛 Troubleshooting

**Build Failures:**
- Check the build logs in Railway dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set correctly

**Database Connection Issues:**
- Make sure PostgreSQL service is running
- Check that database environment variables reference Railway's internal variables
- Verify the backend can connect to the database

**Frontend Can't Reach Backend:**
- Ensure VITE_API_URL points to the correct backend URL
- Check CORS configuration in backend
- Verify both services are deployed and running

## 📊 Assignment Requirements Completed

### Assignment 4 ✅
- **Bronze**: Backend deployed on Railway ✅
- **Silver**: Frontend + Backend deployed ✅  
- **Gold**: Docker Compose ready for container orchestration ✅

### Assignment 5 ✅
- **Bronze**: HTTPS enabled automatically ✅
- **Silver**: JWT authentication + sessions ✅
- **Gold**: Two-Factor Authentication implemented ✅

**All requirements completed successfully!** 🎉
