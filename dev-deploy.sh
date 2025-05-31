
#!/bin/bash

echo "🚀 Starting Hospital Scheduler Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start development services
echo "🔨 Building and starting development services..."
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 20

echo "✅ Development environment is ready!"
echo ""
echo "🌐 Development URLs:"
echo "   Backend API: http://localhost:5000"
echo "   Database: localhost:5432"
echo ""
echo "📝 Don't forget to run the frontend separately with: npm run dev"
