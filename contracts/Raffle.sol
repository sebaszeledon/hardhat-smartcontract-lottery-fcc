// Raffle
// Enter the lottery (paying some amount)
// Pick a random winner (verifiable random)
// Winner to be selected every X minutes -> completely automated
// Chainlink Oracle -> Randomness, Automated Execution (Chainlink keepers)

 // SPDX-License-Identifier: MIT
 pragma solidity 0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "hardhat/console.sol";


 error Raffle__NotEnoughETHEntered();

 contract Raffle is VRFConsumerBaseV2 {
    // State Variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    // Events
    event RaffleEnter(address indexed player);

    constructor(
        uint256 entranceFee,
        address vrfCoordinatorV2
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {

        if (msg.value < i_entranceFee) { 
            revert Raffle__NotEnoughETHEntered(); 
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function requestRandomWinner() external {

    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {

    }

     /* View / Pure Functions */
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
 }