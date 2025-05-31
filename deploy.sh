
#!/bin/bash

echo "🚀 Starting Hospital Scheduler Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your actual values before continuing."
    read -p "Press enter to continue after updating .env file..."
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
if docker-compose ps | grep -q "Up (healthy)"; then
    echo "✅ Services are running and healthy!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost"
    echo "   Backend API: http://localhost:5000"
    echo "   Database: localhost:5432"
    echo ""
    echo "👤 Default login credentials:"
    echo "   Admin: admin@example.com / password"
    echo "   User: user@example.com / password"
else
    echo "❌ Some services are not healthy. Check logs with:"
    echo "   docker-compose logs"
fi
