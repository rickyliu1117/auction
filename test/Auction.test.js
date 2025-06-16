const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction", function () {
    let auction;
    let owner;
    let bidder1;
    let bidder2;
    let bidder3;
    const BIDDING_TIME = 3600n; // 1 hour as BigInt

    beforeEach(async function () {
        // Get signers (accounts)
        [owner, bidder1, bidder2, bidder3] = await ethers.getSigners();

        // Deploy the contract
        const Auction = await ethers.getContractFactory("Auction");
        auction = await Auction.deploy(BIDDING_TIME);
        await auction.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await auction.owner()).to.equal(await owner.getAddress());
        });

        it("Should set the correct start and end times", async function () {
            const startTime = await auction.startTime();
            const endTime = await auction.endTime();
            expect(endTime).to.equal(startTime + BIDDING_TIME);
        });

        it("Should initialize with zero highest bid", async function () {
            expect(await auction.highestBid()).to.equal(0);
        });

        it("Should initialize with no highest bidder", async function () {
            expect(await auction.highestBidder()).to.equal(ethers.ZeroAddress);
        });
    });

    describe("Bidding", function () {
        it("Should allow placing a bid", async function () {
            await auction.connect(bidder1).placeBid({ value: ethers.parseEther("0.1") });
            expect(await auction.highestBid()).to.equal(ethers.parseEther("0.1"));
            expect(await auction.highestBidder()).to.equal(await bidder1.getAddress());
        });

        it("Should not allow bid lower than highest bid", async function () {
            await auction.connect(bidder1).placeBid({ value: ethers.parseEther("0.1") });
            await expect(auction.connect(bidder2).placeBid({ value: ethers.parseEther("0.05") }))
                .to.be.revertedWithCustomError(auction, "BidTooLow");
        });

        it("Should update highest bidder and allow previous bidder to withdraw", async function () {
            await auction.connect(bidder1).placeBid({ value: ethers.parseEther("0.1") });
            await auction.connect(bidder2).placeBid({ value: ethers.parseEther("0.2") });
            expect(await auction.highestBidder()).to.equal(await bidder2.getAddress());
            expect(await auction.bids(await bidder1.getAddress())).to.equal(ethers.parseEther("0.1"));
        });
    });

    describe("Auction End", function () {
        it("Should not allow ending auction before end time", async function () {
            await expect(auction.endAuction())
                .to.be.revertedWithCustomError(auction, "AuctionNotEnded");
        });

        it("Should allow ending auction after end time", async function () {
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [Number(BIDDING_TIME) + 1]);
            await ethers.provider.send("evm_mine");
            
            await auction.endAuction();
            expect(await auction.ended()).to.be.true;
        });

        it("Should not allow ending auction twice", async function () {
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [Number(BIDDING_TIME) + 1]);
            await ethers.provider.send("evm_mine");
            
            await auction.endAuction();
            await expect(auction.endAuction())
                .to.be.revertedWithCustomError(auction, "AuctionAlreadyEnded");
        });
    });

    describe("Withdrawals", function () {
        it("Should allow withdrawal of outbid amount", async function () {
            await auction.connect(bidder1).placeBid({ value: ethers.parseEther("0.1") });
            await auction.connect(bidder2).placeBid({ value: ethers.parseEther("0.2") });
            
            const initialBalance = await ethers.provider.getBalance(await bidder1.getAddress());
            const tx = await auction.connect(bidder1).withdraw();
            const receipt = await tx.wait();
            const gasCost = receipt.gasUsed * receipt.gasPrice;
            const finalBalance = await ethers.provider.getBalance(await bidder1.getAddress());
            expect(finalBalance > (initialBalance - gasCost)).to.be.true;
        });

        it("Should not allow withdrawal if no funds to withdraw", async function () {
            await expect(auction.connect(bidder1).withdraw())
                .to.be.revertedWithCustomError(auction, "NoFundsToWithdraw");
        });
    });

    describe("Auction Status", function () {
        it("Should return correct auction status", async function () {
            const status = await auction.getAuctionStatus();
            expect(status[0]).to.equal(await auction.startTime());
            expect(status[1]).to.equal(await auction.endTime());
            expect(status[2]).to.equal(await auction.highestBid());
            expect(status[3]).to.equal(await auction.highestBidder());
            expect(status[4]).to.equal(await auction.ended());
            expect(status[5]).to.equal(await auction.paused());
        });

        it("Should return correct remaining time", async function () {
            const remainingTime = await auction.getRemainingTime();
            expect(remainingTime).to.equal(BIDDING_TIME);
        });
    });
}); 