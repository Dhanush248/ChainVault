const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustAwareStorage", function () {
  let contract;
  let owner, user1, user2, node1, node2;

  beforeEach(async function () {
    [owner, user1, user2, node1, node2] = await ethers.getSigners();
    
    const TrustAwareStorage = await ethers.getContractFactory("TrustAwareStorage");
    contract = await TrustAwareStorage.deploy();
    await contract.deployed();
  });

  describe("Storage Node Management", function () {
    it("Should register storage nodes", async function () {
      await contract.registerStorageNode(node1.address, 90);
      
      const nodeInfo = await contract.storageNodes(node1.address);
      expect(nodeInfo.trustScore.toNumber()).to.equal(90);
      expect(nodeInfo.isActive).to.be.true;
    });

    it("Should get trusted nodes", async function () {
      await contract.registerStorageNode(node1.address, 90);
      await contract.registerStorageNode(node2.address, 60);
      
      const trustedNodes = await contract.getTrustedNodes();
      expect(trustedNodes.length).to.equal(1);
      expect(trustedNodes[0]).to.equal(node1.address);
    });
  });

  describe("File Management", function () {
    beforeEach(async function () {
      // Register some nodes first
      await contract.registerStorageNode(node1.address, 90);
      await contract.registerStorageNode(node2.address, 85);
    });

    it("Should register a file", async function () {
      const fileHash = "0x1234567890abcdef";
      const fileName = "test.txt";
      const fileSize = 1024;
      const fragmentHashes = ["0xfrag1", "0xfrag2"];
      const fragmentSizes = [512, 512];

      await contract.registerFile(fileHash, fileName, fileSize, fragmentHashes, fragmentSizes);
      
      const fileInfo = await contract.getFileMetadata(fileHash);
      expect(fileInfo.owner).to.equal(owner.address);
      expect(fileInfo.fileName).to.equal(fileName);
      expect(fileInfo.exists).to.be.true;
    });

    it("Should grant and revoke access", async function () {
      const fileHash = "0x1234567890abcdef";
      const fileName = "test.txt";
      const fileSize = 1024;
      const fragmentHashes = ["0xfrag1"];
      const fragmentSizes = [1024];

      await contract.registerFile(fileHash, fileName, fileSize, fragmentHashes, fragmentSizes);
      
      // Grant access
      await contract.grantAccess(fileHash, user1.address);
      expect(await contract.hasFileAccess(fileHash, user1.address)).to.be.true;
      
      // Revoke access
      await contract.revokeAccess(fileHash, user1.address);
      expect(await contract.hasFileAccess(fileHash, user1.address)).to.be.false;
    });
  });
});