// Raffle
// Enter the lottery (paying some amount)
// Pick a random winner (verifiable random)
// Winner to be selected every X minutes -> completely automated
// Chainlink Oracle -> Randomness, Automated Execution (Chainlink keepers)

 // SPDX-License-Identifier: MIT
 pragma solidity 0.8.24;

 error Raffle__NotEnoughETHEntered();

 contract Raffle {
    // State Variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {

        if (msg.value < i_entranceFee) { 
            revert Raffle__NotEnoughETHEntered(); 
        }
        s_players.push(payable(msg.sender));
    }

    // function pickRandomWinner() {

    // }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
 }