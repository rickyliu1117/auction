const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction Gas Comparison Tests", function () {
    let auctionOriginal;
    let auctionOptimized;
    let owner;
    let bidder1;
    let bidder2;
    const BIDDING_TIME = 3600; // 1 hour in seconds

    beforeEach(async function () {
        [owner, bidder1, bidder2] = await ethers.getSigners();
        
        // Deploy both contracts
        const AuctionOriginal = await ethers.getContractFactory("AuctionOriginal");
        const AuctionOptimized = await ethers.getContractFactory("Auction");
        
        auctionOriginal = await AuctionOriginal.deploy(BIDDING_TIME);
        auctionOptimized = await AuctionOptimized.deploy(BIDDING_TIME);
        
        await auctionOriginal.waitForDeployment();
        await auctionOptimized.waitForDeployment();
    });

    function printGasComparison(label, originalGas, optimizedGas) {
        const gasSaved = originalGas - optimizedGas;
        const percentSaved = originalGas > 0 ? (Number(gasSaved) * 100 / Number(originalGas)) : 0;
        console.log(`\n${label} Gas Comparison:`);
        console.log("Original:", originalGas.toString());
        console.log("Optimized:", optimizedGas.toString());
        console.log("Gas Saved:", gasSaved.toString());
        console.log("Percentage Saved:", percentSaved.toFixed(2) + "%");
    }

    describe("Gas Usage Comparison", function () {
        it("Should compare deployment gas", async function () {
            const originalDeploy = await auctionOriginal.deploymentTransaction();
            const optimizedDeploy = await auctionOptimized.deploymentTransaction();
            
            const originalGas = BigInt(originalDeploy.gasLimit.toString());
            const optimizedGas = BigInt(optimizedDeploy.gasLimit.toString());
            printGasComparison("Deployment", originalGas, optimizedGas);
        });

        it("Should compare first bid gas", async function () {
            const originalTx = await auctionOriginal.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            const optimizedTx = await auctionOptimized.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            
            const originalGas = BigInt((await originalTx.wait()).gasUsed.toString());
            const optimizedGas = BigInt((await optimizedTx.wait()).gasUsed.toString());
            printGasComparison("First Bid", originalGas, optimizedGas);
        });

        it("Should compare higher bid gas", async function () {
            // Place first bids
            await auctionOriginal.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            await auctionOptimized.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            
            // Place higher bids
            const originalTx = await auctionOriginal.connect(bidder2).placeBid({ value: ethers.parseEther("2.0") });
            const optimizedTx = await auctionOptimized.connect(bidder2).placeBid({ value: ethers.parseEther("2.0") });
            
            const originalGas = BigInt((await originalTx.wait()).gasUsed.toString());
            const optimizedGas = BigInt((await optimizedTx.wait()).gasUsed.toString());
            printGasComparison("Higher Bid", originalGas, optimizedGas);
        });

        it("Should compare withdrawal gas", async function () {
            // Place bids
            await auctionOriginal.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            await auctionOptimized.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            await auctionOriginal.connect(bidder2).placeBid({ value: ethers.parseEther("2.0") });
            await auctionOptimized.connect(bidder2).placeBid({ value: ethers.parseEther("2.0") });
            
            // Withdraw
            const originalTx = await auctionOriginal.connect(bidder1).withdraw();
            const optimizedTx = await auctionOptimized.connect(bidder1).withdraw();
            
            const originalGas = BigInt((await originalTx.wait()).gasUsed.toString());
            const optimizedGas = BigInt((await optimizedTx.wait()).gasUsed.toString());
            printGasComparison("Withdrawal", originalGas, optimizedGas);
        });

        it("Should compare end auction gas", async function () {
            // Place bids
            await auctionOriginal.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            await auctionOptimized.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [BIDDING_TIME + 1]);
            await ethers.provider.send("evm_mine");
            
            // End auctions
            const originalTx = await auctionOriginal.endAuction();
            const optimizedTx = await auctionOptimized.endAuction();
            
            const originalGas = BigInt((await originalTx.wait()).gasUsed.toString());
            const optimizedGas = BigInt((await optimizedTx.wait()).gasUsed.toString());
            printGasComparison("End Auction", originalGas, optimizedGas);
        });
    });
}); 