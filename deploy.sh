#!/bin/bash
set -e

echo "🔄  Rebuilding containers…"
docker compose down -v
docker compose build --no-cache
docker compose up -d

echo "✅  Stack online:"
echo "    Frontend → http://localhost"
echo "    Backend  → http://localhost:5000"
echo "    Postgres → localhost:5432  (user:postgres  pwd:@Justin2020)"




# #!/bin/bash

# echo "🚀 Starting Hospital Scheduler Deployment..."

# # Check if Docker is running
# if ! docker info > /dev/null 2>&1; then
#     echo "❌ Docker is not running. Please start Docker first."
#     exit 1
# fi

# # Check if .env file exists
# if [ ! -f .env ]; then
#     echo "📝 Creating .env file from example..."
#     cp .env.example .env
#     echo "⚠️  Please update the .env file with your actual values before continuing."
#     read -p "Press enter to continue after updating .env file..."
# fi

# # Clean up any existing containers
# echo "🧹 Cleaning up existing containers..."
# docker-compose down -v
# docker system prune -f

# # Build and start services
# echo "🔨 Building and starting services..."
# docker-compose build --no-cache
# docker-compose up -d

# # Wait for database to be ready
# echo "⏳ Waiting for database to initialize..."
# sleep 45

# # Check if database is ready
# echo "🔍 Checking database health..."
# for i in {1..30}; do
#     if docker-compose exec -T database pg_isready -U postgres > /dev/null 2>&1; then
#         echo "✅ Database is ready!"
#         break
#     fi
#     echo "Waiting for database... ($i/30)"
#     sleep 2
# done

# # Wait for backend to be ready
# echo "⏳ Waiting for backend to start..."
# sleep 20

# # Check service health
# echo "🔍 Checking service health..."
# if docker-compose ps | grep -q "Up"; then
#     echo "✅ Services are running!"
#     echo ""
#     echo "🌐 Application URLs:"
#     echo "   Frontend: http://localhost"
#     echo "   Backend API: http://localhost:5000"
#     echo "   Database: localhost:5432"
#     echo ""
#     echo "👤 Default login credentials:"
#     echo "   Admin: admin@example.com / password"
#     echo "   User: user@example.com / password"
#     echo ""
#     echo "📖 For Railway deployment, see RAILWAY_DEPLOYMENT.md"
# else
#     echo "❌ Some services are not healthy. Check logs with:"
#     echo "   docker-compose logs"
#     echo ""
#     echo "🚂 For easier deployment, consider using Railway:"
#     echo "   See RAILWAY_DEPLOYMENT.md for step-by-step guide"
# fi
