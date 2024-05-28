const { assert, expect } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) 
    ? describe.skip
    : describe("Raffle Unit Tests", async function () {
        let raffle, raffleContract, vrfCoordinatorV2Mock, raffleEntranceFee, interval, player, deployer;

        beforeEach(async function () {
            //accounts = await ethers.getSigners(); // could also do with getNamedAccounts
            deployer = (await getNamedAccounts()).deployer;
            //player = accounts[1];
            await deployments.fixture(["all"]);
            raffle = await ethers.getContract("Raffle", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            raffleEntranceFee = await raffle.getEntranceFee();
            interval = await raffle.getInterval();
        });

        describe("constructor", async function(){
            it("initializes the raffle correctly", async function() {
                // Ideally, we'd separate these out so that only 1 assert per "it" block
                // And ideally, we'd make this check everything
                const raffleState = await raffle.getRaffleState();
                // Comparisons for Raffle initialization:
                assert.equal(raffleState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[network.config.chainId]["keepersUpdateInterval"]);
            });
        });

        describe("enterRaffle", async function() {
            it("reverts when you dont pay enough", async function() {
                await expect(raffle.enterRaffle()).to.be.revertedWith(
                    "Raffle__NotEnoughETHEntered"
                );
            });
            it("records player when they enter", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                const contractPlayer = await raffle.getPlayer(0)
                assert.equal(contractPlayer, deployer);
            });
            it("emits event on enter", async () => {
                expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit( // emits RaffleEnter event if entered to index player(s) address
                    raffle,
                    "RaffleEnter"
                )
            });
            it("doesn't allow entrance when raffle is calculating", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
                await network.provider.request({ method: "evm_mine", params: [] })
                // we pretend to be a keeper for a second
                await raffle.performUpkeep("0x") // changes the state to calculating for our comparison below
                await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith( // is reverted as raffle is calculating
                    "Raffle__NotOpen"
                )
            })
        });

    }); //15:30:21
