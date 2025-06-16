// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Auction {
    // Auction details
    address public owner;
    uint public startTime;
    uint public endTime;
    uint public highestBid;
    address public highestBidder;
    bool public ended;
    
    // Mapping to store bids
    mapping(address => uint) public bids;
    
    // Events
    event BidPlaced(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);
    event WithdrawalSuccessful(address recipient, uint amount);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier auctionActive() {
        require(block.timestamp >= startTime, "Auction hasn't started yet");
        require(block.timestamp <= endTime, "Auction has ended");
        require(!ended, "Auction has been ended");
        _;
    }
    
    // Constructor
    constructor(uint _biddingTime) {
        owner = msg.sender;
        startTime = block.timestamp;
        endTime = startTime + _biddingTime;
        highestBid = 0;
        ended = false;
    }
    
    // Function to place a bid
    function placeBid() public payable auctionActive {
        require(msg.value > highestBid, "Bid must be higher than current highest bid");
        
        // Return the previous highest bidder's bid
        if (highestBidder != address(0)) {
            bids[highestBidder] += highestBid;
        }
        
        highestBid = msg.value;
        highestBidder = msg.sender;
        
        emit BidPlaced(msg.sender, msg.value);
    }
    
    // Function to end the auction
    function endAuction() public onlyOwner {
        require(block.timestamp > endTime, "Auction hasn't ended yet");
        require(!ended, "Auction has already been ended");
        
        ended = true;
        emit AuctionEnded(highestBidder, highestBid);
        
        // Transfer the highest bid to the owner
        payable(owner).transfer(highestBid);
    }
    
    // Function for bidders to withdraw their bids
    function withdraw() public {
        uint amount = bids[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        bids[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit WithdrawalSuccessful(msg.sender, amount);
    }
    
    // Function to get auction status
    function getAuctionStatus() public view returns (
        uint _startTime,
        uint _endTime,
        uint _highestBid,
        address _highestBidder,
        bool _ended
    ) {
        return (startTime, endTime, highestBid, highestBidder, ended);
    }
    
    // Function to get remaining time
    function getRemainingTime() public view returns (uint) {
        if (block.timestamp >= endTime) {
            return 0;
        }
        return endTime - block.timestamp;
    }
} 