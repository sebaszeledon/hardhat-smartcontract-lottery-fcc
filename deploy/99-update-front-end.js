const { ethers, network } = require("hardhat");
const fs = require("fs");
require("dotenv").config();
const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config.js");

const FRONT_END_ADDRESSES_FILE = "../nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json";
const FRONT_END_ABI_FILE = "../nextjs-smartcontract-lottery-fcc/constants/abi.json";

module.exports = async function () {
    if(process.env.UPDATE_FRONT_END){
        console.log("Updating fron end...");
        updateAbi();
        updateContractAddresses();
    }
}

async function updateAbi() {
    const {deploy, log} = deployments;
    const raffleAddress = (await deployments.get("Raffle")).address;
    const raffle = await ethers.getContract("Raffle", raffleAddress);
    fs.writeFileSync(FRONT_END_ABI_FILE, raffle.interface.formatJson());
}

async function updateContractAddresses() {
    const {deploy, log} = deployments;
    const raffleAddress = (await deployments.get("Raffle")).address;
    const raffle = await ethers.getContract("Raffle", raffleAddress);
    const chainId = network.config.chainId.toString();
    const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf-8"));
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.target)){
            currentAddresses[chainId].push(raffle.target);
        }
    } {
        currentAddresses[chainId] = [raffle.target];
    }
    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses));
}

module.exports.tags = ["all", "frontend"];