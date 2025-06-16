const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction Gas Tests", function () {
    let auction;
    let owner;
    let bidder1;
    let bidder2;
    const BIDDING_TIME = 3600; // 1 hour in seconds

    beforeEach(async function () {
        [owner, bidder1, bidder2] = await ethers.getSigners();
        const Auction = await ethers.getContractFactory("Auction");
        auction = await Auction.deploy(BIDDING_TIME);
        await auction.waitForDeployment();
    });

    describe("Gas Usage Tests", function () {
        it("Should measure gas for placing first bid", async function () {
            const bidAmount = ethers.parseEther("1.0");
            const tx = await auction.connect(bidder1).placeBid({ value: bidAmount });
            const receipt = await tx.wait();
            console.log("Gas used for first bid:", receipt.gasUsed.toString());
        });

        it("Should measure gas for placing higher bid", async function () {
            // Place first bid
            await auction.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            
            // Place higher bid and measure gas
            const tx = await auction.connect(bidder2).placeBid({ value: ethers.parseEther("2.0") });
            const receipt = await tx.wait();
            console.log("Gas used for higher bid:", receipt.gasUsed.toString());
        });

        it("Should measure gas for withdrawal", async function () {
            // Place two bids
            await auction.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            await auction.connect(bidder2).placeBid({ value: ethers.parseEther("2.0") });
            
            // Measure withdrawal gas
            const tx = await auction.connect(bidder1).withdraw();
            const receipt = await tx.wait();
            console.log("Gas used for withdrawal:", receipt.gasUsed.toString());
        });

        it("Should measure gas for ending auction", async function () {
            // Place a bid
            await auction.connect(bidder1).placeBid({ value: ethers.parseEther("1.0") });
            
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [BIDDING_TIME + 1]);
            await ethers.provider.send("evm_mine");
            
            // Measure end auction gas
            const tx = await auction.endAuction();
            const receipt = await tx.wait();
            console.log("Gas used for ending auction:", receipt.gasUsed.toString());
        });

        it("Should measure gas for view functions", async function () {
            // Measure getAuctionStatus gas
            const statusTx = await auction.getAuctionStatus();
            console.log("Gas used for getAuctionStatus:", statusTx.toString());
            
            // Measure getRemainingTime gas
            const timeTx = await auction.getRemainingTime();
            console.log("Gas used for getRemainingTime:", timeTx.toString());
        });

        it("Should measure deployment gas", async function () {
            const Auction = await ethers.getContractFactory("Auction");
            const tx = await Auction.deploy(BIDDING_TIME);
            const receipt = await tx.deploymentTransaction().wait();
            console.log("Gas used for deployment:", receipt.gasUsed.toString());
        });
    });
}); 