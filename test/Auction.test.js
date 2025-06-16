const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction", function () {
    let auction;
    let owner;
    let bidder1;
    let bidder2;
    let bidder3;
    const BIDDING_TIME = 3600; // 1 hour in seconds

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
            expect(await auction.owner()).to.equal(owner.address);
        });

        it("Should set the correct start and end times", async function () {
            const startTime = await auction.startTime();
            const endTime = await auction.endTime();
            expect(endTime - startTime).to.equal(BIDDING_TIME);
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
            const bidAmount = ethers.parseEther("1.0");
            await expect(auction.connect(bidder1).placeBid({ value: bidAmount }))
                .to.emit(auction, "BidPlaced")
                .withArgs(bidder1.address, bidAmount);

            expect(await auction.highestBid()).to.equal(bidAmount);
            expect(await auction.highestBidder()).to.equal(bidder1.address);
        });

        it("Should not allow bid lower than highest bid", async function () {
            const bidAmount1 = ethers.parseEther("2.0");
            const bidAmount2 = ethers.parseEther("1.0");

            await auction.connect(bidder1).placeBid({ value: bidAmount1 });
            await expect(auction.connect(bidder2).placeBid({ value: bidAmount2 }))
                .to.be.revertedWith("Bid must be higher than current highest bid");
        });

        it("Should update highest bidder and allow previous bidder to withdraw", async function () {
            const bidAmount1 = ethers.parseEther("1.0");
            const bidAmount2 = ethers.parseEther("2.0");

            await auction.connect(bidder1).placeBid({ value: bidAmount1 });
            await auction.connect(bidder2).placeBid({ value: bidAmount2 });

            expect(await auction.highestBidder()).to.equal(bidder2.address);
            expect(await auction.highestBid()).to.equal(bidAmount2);

            // Check if bidder1 can withdraw their outbid amount
            const initialBalance = await ethers.provider.getBalance(bidder1.address);
            const tx = await auction.connect(bidder1).withdraw();
            await tx.wait();
            const finalBalance = await ethers.provider.getBalance(bidder1.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });
    });

    describe("Auction End", function () {
        it("Should not allow ending auction before end time", async function () {
            await expect(auction.endAuction())
                .to.be.revertedWith("Auction hasn't ended yet");
        });

        it("Should allow ending auction after end time", async function () {
            // Place a bid before ending the auction
            const bidAmount = ethers.parseEther("1.0");
            await auction.connect(bidder1).placeBid({ value: bidAmount });

            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [BIDDING_TIME + 1]);
            await ethers.provider.send("evm_mine");

            await expect(auction.endAuction())
                .to.emit(auction, "AuctionEnded")
                .withArgs(bidder1.address, bidAmount);

            expect(await auction.ended()).to.be.true;
        });

        it("Should not allow ending auction twice", async function () {
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [BIDDING_TIME + 1]);
            await ethers.provider.send("evm_mine");

            await auction.endAuction();
            await expect(auction.endAuction())
                .to.be.revertedWith("Auction has already been ended");
        });
    });

    describe("Withdrawals", function () {
        it("Should allow withdrawal of outbid amount", async function () {
            const bidAmount1 = ethers.parseEther("1.0");
            const bidAmount2 = ethers.parseEther("2.0");

            await auction.connect(bidder1).placeBid({ value: bidAmount1 });
            await auction.connect(bidder2).placeBid({ value: bidAmount2 });

            const initialBalance = await ethers.provider.getBalance(bidder1.address);
            const tx = await auction.connect(bidder1).withdraw();
            await tx.wait();
            const finalBalance = await ethers.provider.getBalance(bidder1.address);

            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should not allow withdrawal if no funds to withdraw", async function () {
            await expect(auction.connect(bidder1).withdraw())
                .to.be.revertedWith("No funds to withdraw");
        });
    });

    describe("Auction Status", function () {
        it("Should return correct auction status", async function () {
            const bidAmount = ethers.parseEther("1.0");
            await auction.connect(bidder1).placeBid({ value: bidAmount });

            const status = await auction.getAuctionStatus();
            expect(status[2]).to.equal(bidAmount); // highestBid
            expect(status[3]).to.equal(bidder1.address); // highestBidder
            expect(status[4]).to.be.false; // ended
        });

        it("Should return correct remaining time", async function () {
            const remainingTime = await auction.getRemainingTime();
            expect(remainingTime).to.equal(BIDDING_TIME);
        });
    });
}); 