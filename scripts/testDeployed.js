require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
    // Load environment variables
    const contractAddress = "0x5741215DE80E16F779866d8C0f1b5561F9C3be47";
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const bidder2Key = process.env.BIDDER2_PRIVATE_KEY;
    const bidder2 = bidder2Key ? new ethers.Wallet(bidder2Key, provider) : null;

    // Get contract ABI (from artifacts)
    const fs = require("fs");
    const artifact = JSON.parse(fs.readFileSync("artifacts/contracts/Auction.sol/Auction.json", "utf8"));
    const auctionOwner = new ethers.Contract(contractAddress, artifact.abi, owner);
    const auctionBidder2 = bidder2 ? new ethers.Contract(contractAddress, artifact.abi, bidder2) : null;

    console.log("\nTesting deployed Auction contract...");
    console.log("Contract address:", contractAddress);
    console.log("Owner address:", owner.address);
    if (bidder2) console.log("Bidder2 address:", bidder2.address);

    // Get initial auction status
    console.log("\nInitial Auction Status:");
    const initialStatus = await auctionOwner.getAuctionStatus();
    console.log("Start Time:", new Date(Number(initialStatus[0]) * 1000).toLocaleString());
    console.log("End Time:", new Date(Number(initialStatus[1]) * 1000).toLocaleString());
    console.log("Highest Bid:", ethers.formatEther(initialStatus[2]), "ETH");
    console.log("Highest Bidder:", initialStatus[3]);
    console.log("Ended:", initialStatus[4]);

    // Place a bid from the owner (for demonstration)
    // console.log("\nPlacing a bid (0.1 ETH) from Owner...");
    // const bidTx = await auctionOwner.placeBid({ value: ethers.parseEther("0.1") });
    // await bidTx.wait();
    // console.log("Bid placed successfully!");

    // Place a bid from bidder2 (if available)
    if (auctionBidder2) {
        console.log("\nPlacing a bid (0.2 ETH) from Bidder2...");
        const bid2Tx = await auctionBidder2.placeBid({ value: ethers.parseEther("0.2") });
        await bid2Tx.wait();
        console.log("Bid placed successfully!");
    } else {
        console.log("\nNo BIDDER2_PRIVATE_KEY found in .env, skipping bidder2 bid test.");
    }

    // Get updated auction status
    console.log("\nUpdated Auction Status:");
    const updatedStatus = await auctionOwner.getAuctionStatus();
    console.log("Highest Bid:", ethers.formatEther(updatedStatus[2]), "ETH");
    console.log("Highest Bidder:", updatedStatus[3]);

    // Withdraw from owner (should have funds if outbid)
    console.log("\nAttempting withdrawal from Owner (should succeed if outbid)...");
    try {
        const withdrawTx = await auctionOwner.withdraw();
        await withdrawTx.wait();
        console.log("Withdrawal successful!");
    } catch (e) {
        console.log("Withdrawal failed (likely not outbid):", e.message);
    }

    // Fast-forward time to after auction end (if local, not possible on Sepolia)
    // Instead, attempt to end the auction (will only succeed if auction ended)
    console.log("\nAttempting to end the auction as Owner...");
    try {
        const endTx = await auctionOwner.endAuction();
        await endTx.wait();
        console.log("Auction ended successfully!");
    } catch (e) {
        console.log("End auction failed (likely not ended yet):", e.message);
    }

    // Attempt to place a late bid (should fail if auction ended)
    if (auctionBidder2) {
        console.log("\nAttempting to place a late bid from Bidder2...");
        try {
            const lateBidTx = await auctionBidder2.placeBid({ value: ethers.parseEther("0.3") });
            await lateBidTx.wait();
            console.log("Late bid placed (unexpected, auction may not be ended)");
        } catch (e) {
            console.log("Late bid failed as expected:", e.message);
        }
    }

    // Get final auction status
    const finalStatus = await auctionOwner.getAuctionStatus();
    console.log("\nFinal Auction Status:");
    console.log("Highest Bid:", ethers.formatEther(finalStatus[2]), "ETH");
    console.log("Highest Bidder:", finalStatus[3]);
    console.log("Ended:", finalStatus[4]);

    console.log("\nExtended tests completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 