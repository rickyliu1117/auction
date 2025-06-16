// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Auction {
    // Auction details
    address public immutable owner;
    uint public immutable startTime;
    uint public immutable endTime;
    uint public highestBid;
    address public highestBidder;
    bool public ended;
    bool public paused;
    
    // Mapping to store bids
    mapping(address => uint) public bids;
    
    // Reentrancy guard using uint256 for gas efficiency
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;
    
    // Events
    event BidPlaced(address indexed bidder, uint amount);
    event AuctionEnded(address indexed winner, uint amount);
    event WithdrawalSuccessful(address indexed recipient, uint amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event HighestBidderChanged(address indexed previousBidder, address indexed newBidder, uint amount);
    
    // Custom errors for gas optimization
    error OnlyOwner();
    error AuctionNotEnded();
    error AuctionHasEnded();
    error AuctionAlreadyEnded();
    error BidTooLow();
    error NoFundsToWithdraw();
    error TransferFailed();
    error ContractIsPaused();
    error ReentrancyGuard();
    
    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    modifier auctionActive() {
        if (paused) revert ContractIsPaused();
        if (block.timestamp < startTime) revert("Auction not started");
        if (block.timestamp > endTime) revert("Auction has ended");
        if (ended) revert("Auction already ended");
        _;
    }
    
    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrancyGuard();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
    
    // Constructor
    constructor(uint _biddingTime) {
        owner = msg.sender;
        startTime = block.timestamp;
        endTime = startTime + _biddingTime;
        _status = _NOT_ENTERED;
    }
    
    // Function to place a bid
    function placeBid() external payable auctionActive nonReentrant {
        if (msg.value <= highestBid) revert BidTooLow();
        
        address previousBidder = highestBidder;
        uint previousBid = highestBid;
        
        // Update state before external calls
        highestBid = msg.value;
        highestBidder = msg.sender;
        
        // Return the previous highest bidder's bid
        if (previousBidder != address(0)) {
            bids[previousBidder] += previousBid;
        }
        
        emit BidPlaced(msg.sender, msg.value);
        emit HighestBidderChanged(previousBidder, msg.sender, msg.value);
    }
    
    // Function to end the auction
    function endAuction() external onlyOwner nonReentrant {
        if (block.timestamp <= endTime) revert AuctionNotEnded();
        if (ended) revert AuctionAlreadyEnded();
        
        ended = true;
        emit AuctionEnded(highestBidder, highestBid);
        
        // Transfer the highest bid to the owner
        (bool success, ) = payable(owner).call{value: highestBid}("");
        if (!success) revert TransferFailed();
    }
    
    // Function for bidders to withdraw their bids
    function withdraw() external nonReentrant {
        uint amount = bids[msg.sender];
        if (amount == 0) revert NoFundsToWithdraw();
        
        // Update state before external call
        bids[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit WithdrawalSuccessful(msg.sender, amount);
    }
    
    // Emergency pause function
    function pause() external onlyOwner {
        if (paused) revert ContractIsPaused();
        paused = true;
        emit Paused(msg.sender);
    }
    
    // Unpause function
    function unpause() external onlyOwner {
        if (!paused) revert ContractIsPaused();
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    // Function to get auction status
    function getAuctionStatus() external view returns (
        uint _startTime,
        uint _endTime,
        uint _highestBid,
        address _highestBidder,
        bool _ended,
        bool _paused
    ) {
        return (startTime, endTime, highestBid, highestBidder, ended, paused);
    }
    
    // Function to get remaining time
    function getRemainingTime() external view returns (uint) {
        return block.timestamp >= endTime ? 0 : endTime - block.timestamp;
    }
} 