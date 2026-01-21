const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying TrustAwareStorage contract...");

  // Deploy the contract
  const TrustAwareStorage = await hre.ethers.getContractFactory("TrustAwareStorage");
  const contract = await TrustAwareStorage.deploy();
  
  await contract.deployed();
  const contractAddress = contract.address;
  
  console.log(`✅ Contract deployed to: ${contractAddress}`);

  // Get signers for simulated storage nodes
  const [deployer, node1, node2, node3, node4, node5] = await hre.ethers.getSigners();
  
  console.log("📦 Registering storage nodes...");
  
  // Register storage nodes with different trust scores
  const nodes = [
    { address: node1.address, trustScore: 95, name: "Node-1 (High Trust)" },
    { address: node2.address, trustScore: 85, name: "Node-2 (High Trust)" },
    { address: node3.address, trustScore: 75, name: "Node-3 (Medium Trust)" },
    { address: node4.address, trustScore: 60, name: "Node-4 (Low Trust)" },
    { address: node5.address, trustScore: 40, name: "Node-5 (Very Low Trust)" }
  ];

  for (const node of nodes) {
    try {
      const tx = await contract.registerStorageNode(node.address, node.trustScore);
      await tx.wait();
      console.log(`✅ Registered ${node.name}: ${node.address} (Trust: ${node.trustScore})`);
    } catch (error) {
      console.log(`❌ Failed to register ${node.name}:`, error.message);
    }
  }

  console.log("\n🎉 Deployment completed!");
  console.log("📋 Contract Details:");
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Network: ${hre.network.name}`);
  console.log(`   Chain ID: ${hre.network.config.chainId}`);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    storageNodes: nodes
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    './deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });