const { assert, expect } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) 
    ? describe.skip
    : describe("Raffle Unit Tests", async function () {
        let raffle, raffleContract, vrfCoordinatorV2Mock, raffleEntranceFee, interval, player; // , deployer

        beforeEach(async function () {
            const { deployer } = await getNamedAccounts();
            await deployments.fixture(["all"]);
            raffle = await ethers.getContract("Raffle", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        });

        describe("constructor", async function(){
            it("initializes the raffle correctly", async function() {
                // Ideally, we'd separate these out so that only 1 assert per "it" block
                // And ideally, we'd make this check everything
                const raffleState = await raffle.getRaffleState();
                const interval = await raffle.getInterval();
                // Comparisons for Raffle initialization:
                assert.equal(raffleState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[network.config.chainId]["keepersUpdateInterval"]);
            });
        });
        
    }); //15:26:37
