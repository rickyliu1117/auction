require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    console.log("Testing deployed Auction contract...");

    // Updated contract address
    const contractAddress = "0x5180711DA75B60e70Fe16baF36e74990377f4348";

    // Load private keys from environment variables
    const ownerKey = process.env.OWNER_PRIVATE_KEY;
    const bidder1Key = process.env.BIDDER1_PRIVATE_KEY;
    const bidder2Key = process.env.BIDDER2_PRIVATE_KEY;
    const rpcUrl = process.env.SEPOLIA_RPC_URL;

    if (!ownerKey || !bidder1Key || !bidder2Key || !rpcUrl) {
        throw new Error("Please set OWNER_PRIVATE_KEY, BIDDER1_PRIVATE_KEY, BIDDER2_PRIVATE_KEY, and SEPOLIA_RPC_URL in your .env file");
    }

    // Create provider and signers
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const owner = new ethers.Wallet(ownerKey, provider);
    const bidder1 = new ethers.Wallet(bidder1Key, provider);
    const bidder2 = new ethers.Wallet(bidder2Key, provider);

    console.log("Contract address:", contractAddress);
    console.log("Owner address:", owner.address);
    console.log("Bidder1 address:", bidder1.address);
    console.log("Bidder2 address:", bidder2.address);

    // Attach to the deployed contract
    const Auction = await ethers.getContractFactory("Auction", owner);
    const auction = await Auction.attach(contractAddress);

    // Log initial auction status
    console.log("\nInitial Auction Status:");
    const status = await auction.getAuctionStatus();
    console.log("Start Time:", status[0].toString());
    console.log("End Time:", status[1].toString());
    console.log("Highest Bid:", ethers.formatEther(status[2]));
    console.log("Highest Bidder:", status[3]);
    console.log("Ended:", status[4]);
    console.log("Paused:", status[5]);

    // Place a bid from bidder1
    console.log("\nPlacing bid from Bidder1...");
    const auctionBidder1 = auction.connect(bidder1);
    const bidAmount1 = ethers.parseEther("0.1");
    const bidder1BalanceBefore = await provider.getBalance(bidder1.address);
    await auctionBidder1.placeBid({ value: bidAmount1 });
    const bidder1BalanceAfter = await provider.getBalance(bidder1.address);
    console.log("Bidder1 Balance Before Bid:", ethers.formatEther(bidder1BalanceBefore), "ETH");
    console.log("Bidder1 Balance After Bid:", ethers.formatEther(bidder1BalanceAfter), "ETH");
    console.log("Bid placed successfully!");

    // Place a higher bid from bidder2
    console.log("\nPlacing higher bid from Bidder2...");
    const auctionBidder2 = auction.connect(bidder2);
    const bidAmount2 = ethers.parseEther("0.15");
    await auctionBidder2.placeBid({ value: bidAmount2 });
    console.log("Higher bid placed successfully!");

    // Log updated auction status
    console.log("\nUpdated Auction Status:");
    const updatedStatus = await auction.getAuctionStatus();
    console.log("Highest Bid:", ethers.formatEther(updatedStatus[2]));
    console.log("Highest Bidder:", updatedStatus[3]);

    // Withdraw funds from bidder1
    console.log("\nWithdrawing funds from Bidder1...");
    await auctionBidder1.withdraw();
    console.log("Withdrawal successful!");

    // Log remaining time
    const remainingTime = await auction.getRemainingTime();
    console.log("\nRemaining Time:", remainingTime.toString(), "seconds");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 