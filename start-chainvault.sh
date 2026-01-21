#!/bin/bash

# ChainVault Startup Script
echo "🚀 Starting ChainVault - Trust-Aware Decentralized Storage System"
echo "=================================================================="

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python >/dev/null 2>&1 || { echo "❌ Python is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down ChainVault..."
    kill $HARDHAT_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Hardhat node
echo "📡 Starting Hardhat blockchain node..."
cd blockchain
npx hardhat node &
HARDHAT_PID=$!
cd ..

# Wait for Hardhat to start
sleep 5

# Deploy contracts
echo "📋 Deploying smart contracts..."
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
cd ..

# Start backend
echo "🔧 Starting FastAPI backend..."
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting React frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 ChainVault is now running!"
echo "================================"
echo "📡 Blockchain: http://localhost:8545 (Hardhat)"
echo "🔧 Backend API: http://localhost:8000"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "📋 Next Steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Install MetaMask if not already installed"
echo "3. Connect MetaMask to Hardhat Local Network"
echo "4. Import one of the test accounts from Hardhat"
echo "5. Start uploading and managing files!"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all processes
wait