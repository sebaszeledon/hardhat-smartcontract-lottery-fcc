const { assert, expect } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) 
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
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

        describe("constructor", function(){
            it("initializes the raffle correctly", async function() {
                // Ideally, we'd separate these out so that only 1 assert per "it" block
                // And ideally, we'd make this check everything
                const raffleState = await raffle.getRaffleState();
                // Comparisons for Raffle initialization:
                assert.equal(raffleState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[network.config.chainId]["keepersUpdateInterval"]);
            });
        });

        describe("enterRaffle", function() {
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
                await raffle.enterRaffle({ value: raffleEntranceFee });
                // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
                // we pretend to be a keeper for a second
                await raffle.performUpkeep("0x"); // changes the state to calculating for our comparison below
                await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith( // is reverted as raffle is calculating
                    "Raffle__NotOpen"
                );
            });
        });
        describe("checkUpkeep", async function () {
            it("returns false if people haven't sent any ETH", async () => {
                await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
                const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x");// upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(!upkeepNeeded);
            });
            it("returns false if raffle isn't open", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
                await raffle.performUpkeep("0x"); // changes the state to calculating
                const raffleState = await raffle.getRaffleState(); // stores the new state
                const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert.equal(raffleState.toString() == "1", upkeepNeeded == false)
            });
            it("returns false if enough time hasn't passed", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [Number(interval) - 5]); // use a higher number here if this test fails
                await network.provider.request({ method: "evm_mine", params: [] });
                const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(!upkeepNeeded);
            });
            it("returns true if enough time has passed, has players, eth, and is open", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
                const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x");  // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(upkeepNeeded);
            });
        });
        describe("performUpkeep", function () {
            it("can only run if checkupkeep is true", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
                const tx = await raffle.performUpkeep("0x");
                assert(tx);
            });
            it("reverts if checkup is false", async () => {
                await expect(raffle.performUpkeep("0x")).to.be.revertedWith( 
                    "Raffle_UpkeepNotNeeded"
                );
            });
            it("updates the raffle state and emits a requestId", async () => {
                // Too many asserts in this test!
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
                const txResponse = await raffle.performUpkeep("0x"); // emits requestId
                const txReceipt = await txResponse.wait(1); // waits 1 block
                const raffleState = await raffle.getRaffleState(); // updates state
                const requestId = await txReceipt.logs[1].args.requestId;
                assert(Number(requestId) > 0);
                assert(raffleState.toString() == 1); // 0 = open, 1 = calculating
            });
        });
        describe("fulfillRandomWords", function () {
            beforeEach(async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
            })
            it("can only be called after performupkeep", async () => {
                await expect(
                    vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.target) // reverts if not fulfilled
                ).to.be.revertedWith("nonexistent request");
                await expect(
                    vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.target) // reverts if not fulfilled
                ).to.be.revertedWith("nonexistent request");
            });
            // This test simulates users entering the raffle and wraps the entire functionality of the raffle
            it("picks a winner, resets, and sends money", async () => {
                const additionalEntrances = 3; // to test
                  const startingIndex = 2;
                  let startingBalance;
                  for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) { // i = 2; i < 5; i=i+1
                      raffle = raffleContract.connect(accounts[i]); // Returns a new instance of the Raffle contract connected to player
                      await raffle.enterRaffle({ value: raffleEntranceFee });
                  }
                  const startingTimeStamp = await raffle.getLastTimeStamp(); // stores starting timestamp (before we fire our event)
                  
                  await new Promise(async (resolve, reject) => {
                    raffle.once("WinnerPicked", async () => { // event listener for WinnerPicked
                        console.log("WinnerPicked event fired!")
                        // assert throws an error if it fails, so we need to wrap
                        // it in a try/catch so that the promise returns event
                        // if it fails.
                        try {
                            // Now lets get the ending values...
                            const recentWinner = await raffle.getRecentWinner()
                            const raffleState = await raffle.getRaffleState()
                            const winnerBalance = await accounts[2].getBalance()
                            const endingTimeStamp = await raffle.getLastTimeStamp()
                            await expect(raffle.getPlayer(0)).to.be.reverted
                            // Comparisons to check if our ending values are correct:
                            assert.equal(recentWinner.toString(), accounts[2].address)
                            assert.equal(raffleState, 0)
                            assert.equal(
                                winnerBalance.toString(), 
                                startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                    .add(
                                        raffleEntranceFee
                                            .mul(additionalEntrances)
                                            .add(raffleEntranceFee)
                                    )
                                    .toString()
                            )
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve() // if try passes, resolves the promise 
                        } catch (e) { 
                            reject(e) // if try fails, rejects the promise
                        }
                    })
                  });
            });
        });

    }); //15:52:11
