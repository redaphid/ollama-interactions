#!/bin/bash

echo "🛫 Ollama & MCP Offline Setup Script"
echo "===================================="
echo "This script will prepare everything for offline AI experimentation"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check system requirements
print_info "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18+."
    exit 1
fi

print_status "Node.js $(node -v) is installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm $(npm -v) is installed"

# Install npm dependencies
print_info "Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install npm dependencies"
    exit 1
fi

print_status "npm dependencies installed successfully"

# Check Ollama installation
if ! command -v ollama &> /dev/null; then
    print_error "Ollama is not installed."
    echo ""
    echo "Please install Ollama:"
    echo "  macOS: brew install ollama"
    echo "  Linux: curl https://ollama.ai/install.sh | sh"
    echo "  Or download from: https://ollama.ai"
    echo ""
    echo "After installation:"
    echo "  1. Run: ollama serve"
    echo "  2. Run this script again"
    exit 1
fi

print_status "Ollama is installed"

# Check if Ollama server is running
print_info "Checking Ollama server..."
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    print_error "Ollama server is not running."
    echo ""
    echo "Please start Ollama server:"
    echo "  ollama serve"
    echo ""
    echo "Leave it running and execute this script again."
    exit 1
fi

print_status "Ollama server is running"

# Run complete setup
print_info "Running complete setup and model downloads..."
npx tsx src/complete-setup.ts

if [ $? -ne 0 ]; then
    print_error "Setup process failed"
    exit 1
fi

# Verify setup
print_info "Verifying complete setup..."
npx tsx scripts/verify-offline-setup.ts

if [ $? -ne 0 ]; then
    print_error "Setup verification failed"
    exit 1
fi

# Run tests
print_info "Running integration tests..."
npm run test:all

if [ $? -ne 0 ]; then
    print_warning "Some tests failed, but basic setup is complete"
else
    print_status "All tests passed!"
fi

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
print_status "System is ready for offline experimentation"
echo ""
echo "📋 What you can do now:"
echo "  npm run examples              - Run all examples"
echo "  npm run test:all             - Run complete test suite"
echo "  npm run test:comprehensive   - Run comprehensive tests"
echo "  npm run test:performance     - Run performance tests"
echo ""
echo "  npx tsx src/01-simple-interaction.ts    - Basic chat"
echo "  npx tsx src/04-rag-system.ts           - RAG system"
echo "  npx tsx src/mcp/01-mcp-host.ts         - MCP server"
echo ""
echo "📚 All examples and dependencies are downloaded and ready!"
echo "🛫 Perfect for offline learning during your flight! ✈️"
echo ""
echo "💡 Tips:"
echo "  - All models are cached locally"
echo "  - No internet required after setup"
echo "  - Experiment with different prompts"
echo "  - Modify examples for your use cases"
