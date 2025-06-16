# Auction Smart Contract

## Overview
This project implements a secure and gas-optimized auction smart contract on the Ethereum blockchain. The contract allows users to place bids, withdraw funds, and end the auction after a specified bidding time.

## Features
- Secure bidding mechanism
- Reentrancy protection
- Pause/unpause functionality
- Gas-optimized operations
- Comprehensive test suite

## Contract Address
- **Sepolia Network:** [0x5180711DA75B60e70Fe16baF36e74990377f4348](https://sepolia.etherscan.io/address/0x5180711DA75B60e70Fe16baF36e74990377f4348#code)

## Development
- **Solidity Version:** 0.8.20
- **Hardhat:** Used for development, testing, and deployment
- **OpenZeppelin:** Utilized for security best practices

## Testing
Run the test suite with:
```bash
npx hardhat test
```

## Deployment
Deploy to Sepolia with:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## License
MIT
