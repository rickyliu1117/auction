// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Auction {
    // Auction details
    address public immutable owner;  // Make owner immutable
    uint public immutable startTime; // Make startTime immutable
    uint public immutable endTime;   // Make endTime immutable
    uint public highestBid;
    address public highestBidder;
    bool public ended;
    
    // Mapping to store bids
    mapping(address => uint) public bids;
    
    // Events
    event BidPlaced(address indexed bidder, uint amount);  // Add indexed for better filtering
    event AuctionEnded(address indexed winner, uint amount);
    event WithdrawalSuccessful(address indexed recipient, uint amount);
    
    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert("Only owner can call this function");
        _;
    }
    
    modifier auctionActive() {
        if (block.timestamp < startTime) revert("Auction hasn't started yet");
        if (block.timestamp > endTime) revert("Auction has ended");
        if (ended) revert("Auction has been ended");
        _;
    }
    
    // Constructor
    constructor(uint _biddingTime) {
        owner = msg.sender;
        startTime = block.timestamp;
        endTime = startTime + _biddingTime;
    }
    
    // Function to place a bid
    function placeBid() external payable auctionActive {  // Changed to external for gas optimization
        if (msg.value <= highestBid) revert("Bid must be higher than current highest bid");
        
        // Return the previous highest bidder's bid
        if (highestBidder != address(0)) {
            bids[highestBidder] += highestBid;
        }
        
        highestBid = msg.value;
        highestBidder = msg.sender;
        
        emit BidPlaced(msg.sender, msg.value);
    }
    
    // Function to end the auction
    function endAuction() external onlyOwner {  // Changed to external
        if (block.timestamp <= endTime) revert("Auction hasn't ended yet");
        if (ended) revert("Auction has already been ended");
        
        ended = true;
        emit AuctionEnded(highestBidder, highestBid);
        
        // Transfer the highest bid to the owner
        (bool success, ) = payable(owner).call{value: highestBid}("");  // Use call instead of transfer
        if (!success) revert("Transfer failed");
    }
    
    // Function for bidders to withdraw their bids
    function withdraw() external {  // Changed to external
        uint amount = bids[msg.sender];
        if (amount == 0) revert("No funds to withdraw");
        
        bids[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");  // Use call instead of transfer
        if (!success) revert("Transfer failed");
        
        emit WithdrawalSuccessful(msg.sender, amount);
    }
    
    // Function to get auction status
    function getAuctionStatus() external view returns (  // Changed to external
        uint _startTime,
        uint _endTime,
        uint _highestBid,
        address _highestBidder,
        bool _ended
    ) {
        return (startTime, endTime, highestBid, highestBidder, ended);
    }
    
    // Function to get remaining time
    function getRemainingTime() external view returns (uint) {  // Changed to external
        return block.timestamp >= endTime ? 0 : endTime - block.timestamp;  // Use ternary operator
    }
} 