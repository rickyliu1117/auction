const hre = require("hardhat");

async function main() {
  const BIDDING_TIME = 3600; // 1 hour in seconds

  console.log("Deploying Auction contract...");
  
  const Auction = await hre.ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(BIDDING_TIME);
  await auction.waitForDeployment();

  const address = await auction.getAddress();
  console.log(`Auction contract deployed to: ${address}`);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await auction.deploymentTransaction().wait(5);

  // Verify the contract on Etherscan
  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [BIDDING_TIME],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.log("Error verifying contract:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 