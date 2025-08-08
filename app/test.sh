#!/bin/bash

# Test script for the qrimzn application

echo "Testing qrimzn application..."

# Check if the application is running
echo "Checking if application is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running"
else
    echo "❌ Application is not running on port 3000"
    exit 1
fi

# Test the /test endpoint
echo "Testing /test endpoint..."
response=$(curl -s http://localhost:3000/test)
echo "Response: $response"

# Check if output files were created
echo "Checking output files..."
if [ -f "./output/resized_400px.png" ]; then
    echo "✅ 400px image created"
else
    echo "❌ 400px image not found"
fi

if [ -f "./output/resized_800px.png" ]; then
    echo "✅ 800px image created"
else
    echo "❌ 800px image not found"
fi

if [ -f "./output/resized_1200px.png" ]; then
    echo "✅ 1200px image created"
else
    echo "❌ 1200px image not found"
fi

echo "Test complete!" 