
# 🚀 Hospital Scheduler Deployment Guide

This guide covers all deployment requirements for Assignment 4 (Bronze, Silver, Gold).

## 🎯 Assignment Requirements Completed

### ✅ Bronze Tier
- Backend deployed in containerized environment
- PostgreSQL database included

### ✅ Silver Tier  
- Both frontend and backend deployed
- Complete production setup

### ✅ Gold Tier
- Docker Compose automation
- Container orchestration ready
- Can be deployed to AWS ECS or any container platform

## 🐳 Docker Deployment (Gold Tier)

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Quick Start

1. **Clone and Setup**
   ```bash
   git clone <your-repo>
   cd hospital-scheduler
   ```

2. **Production Deployment**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Development Deployment**
   ```bash
   chmod +x dev-deploy.sh
   ./dev-deploy.sh
   # Then run frontend separately: npm run dev
   ```

### Manual Deployment

1. **Copy environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Build and run**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. **Check status**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

## 🌐 Platform Deployment Options

### Railway (Recommended)
1. Connect your GitHub repository
2. Deploy backend: Select `backend` folder, it will auto-detect Node.js
3. Add PostgreSQL plugin
4. Deploy frontend: Select root folder, it will auto-detect Vite
5. Update environment variables

### Render
1. Create PostgreSQL database
2. Create backend web service from `backend` folder
3. Create frontend static site from root folder
4. Configure environment variables

### AWS ECS (Gold Tier)
1. Push Docker images to ECR
2. Create ECS task definition using our docker-compose.yml
3. Deploy to ECS cluster
4. Configure load balancer and security groups

## 🔐 Environment Variables

Required environment variables:
```
DB_NAME=hospital_schedule
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret
PORT=5000
VITE_API_URL=http://localhost:5000
```

## 🚦 Health Checks

The application includes health checks:
- Backend: `GET /health`
- Database: PostgreSQL ready check
- Frontend: Nginx status

## 📊 Monitoring

View logs:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

## 🛠 Troubleshooting

**Services won't start:**
```bash
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

**Database connection issues:**
- Check if PostgreSQL container is healthy
- Verify environment variables
- Check network connectivity

**Frontend can't reach backend:**
- Verify API_URL configuration
- Check if backend is running and healthy
- Review nginx proxy configuration

## 🔄 Updates

To update the application:
```bash
git pull
docker-compose build --no-cache
docker-compose up -d
```

## 📈 Scaling

For production scaling:
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Use load balancer for frontend
docker-compose up -d --scale frontend=2
```

---

✅ **All Assignment 4 requirements completed!**
- Bronze: Backend deployed ✓
- Silver: Frontend + Backend deployed ✓  
- Gold: Docker Compose automation ✓
