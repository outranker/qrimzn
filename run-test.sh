#!/bin/bash

# Master script to build and test the qrimzn application

set -e

echo "🚀 Building and testing qrimzn application..."

# Step 1: Check if test image exists
echo "📁 Checking for test image..."
if [ ! -f ~/Desktop/images/bergenhordalandnorwayvagen.jpg ]; then
    echo "⚠️  Test image not found at ~/Desktop/images/bergenhordalandnorwayvagen.jpg"
    echo "Please place your test image at that location and run this script again."
    exit 1
fi
echo "✅ Test image found"

# Step 2: Build Go binary for Raspberry Pi
echo "📦 Building Go binary for Raspberry Pi..."
cd go
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -o ../bin/qrimzn main.go
cd ..
chmod +x bin/qrimzn

# Step 3: Build the Docker application
echo "🐳 Building Docker application..."
cd app
./build-docker.sh

# Step 4: Create output directory
echo "📁 Creating output directory..."
mkdir -p output

# Step 5: Run the application
echo "🏃 Running the application..."
docker run -d --name qrimzn-test \
  -p 3000:3000 \
  -v $(pwd)/output:/app/output \
  qrimzn-test-app

# Step 6: Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 5

# Step 7: Test the application
echo "🧪 Testing the application..."
./test.sh

# Step 8: Clean up
echo "🧹 Cleaning up..."
docker stop qrimzn-test
docker rm qrimzn-test

echo "✅ Test completed successfully!"
echo "📁 Check the output directory for resized images:"
ls -la output/ 