@echo off
echo 🚀 Starting ChainVault - Trust-Aware Decentralized Storage System
echo ==================================================================

echo ✅ Starting services...

echo 📡 Starting Hardhat blockchain node...
start "Hardhat Node" cmd /k "cd blockchain && npx hardhat node"

timeout /t 5 /nobreak > nul

echo 📋 Deploying smart contracts...
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
cd ..

echo 🔧 Starting FastAPI backend...
start "Backend API" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak > nul

echo 🎨 Starting React frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo 🎉 ChainVault is now running!
echo ================================
echo 📡 Blockchain: http://localhost:8545 (Hardhat)
echo 🔧 Backend API: http://localhost:8000
echo 🎨 Frontend: http://localhost:3000
echo.
echo 📋 Next Steps:
echo 1. Open http://localhost:3000 in your browser
echo 2. Install MetaMask if not already installed
echo 3. Connect MetaMask to Hardhat Local Network
echo 4. Import one of the test accounts from Hardhat
echo 5. Start uploading and managing files!
echo.
echo Press any key to exit...
pause > nul