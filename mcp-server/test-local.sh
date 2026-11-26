#!/bin/bash

echo "🧪 Testing Movies Tracker MCP Server Setup"
echo "=========================================="
echo ""

# Check if backend is running
echo "1. Checking backend health..."
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend not running on http://localhost:8000"
    echo "   → Start it with: cd backend && python app.py"
    exit 1
fi

# Check if .env exists
echo ""
echo "2. Checking .env file..."
if [ -f .env ]; then
    echo "   ✅ .env file exists"
    if grep -q "FIREBASE_ID_TOKEN=your_token_here" .env || grep -q "FIREBASE_ID_TOKEN=$" .env; then
        echo "   ⚠️  Warning: FIREBASE_ID_TOKEN looks like placeholder"
        echo "   → Update it with your real Firebase token"
    else
        echo "   ✅ FIREBASE_ID_TOKEN is set"
    fi
else
    echo "   ❌ .env file not found"
    echo "   → Copy from: cp .env.example .env"
    exit 1
fi

# Check if built
echo ""
echo "3. Checking build..."
if [ -d dist ]; then
    echo "   ✅ dist/ folder exists"
else
    echo "   ❌ Not built yet"
    echo "   → Run: npm run build"
    exit 1
fi

# Check if dependencies installed
echo ""
echo "4. Checking dependencies..."
if [ -d node_modules ]; then
    echo "   ✅ node_modules exists"
else
    echo "   ❌ Dependencies not installed"
    echo "   → Run: npm install"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ All checks passed! MCP server is ready."
echo ""
echo "Next steps:"
echo "1. Configure your CLI tool with:"
echo "   Command: node"
echo "   Args: $(pwd)/dist/index.js"
echo ""
echo "2. Test by asking your AI assistant:"
echo "   'Search for movies in the Movies Tracker'"
echo ""
