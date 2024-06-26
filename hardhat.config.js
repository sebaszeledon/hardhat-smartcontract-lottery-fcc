require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();
//require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "oxkey";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "key";

module.exports = {
  solidity: "0.8.24",
  namedAccounts: {
    deployer: {
        default: 0,
        player: {
          default: 1,
        }, 
    },
  },
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
        {
            version: "0.8.0",
        },
        {
            version: "0.6.6",
        },
        {
          version: "0.8.24",
        },
    ],
  },
  networks: {
    hardhat: {
        chainId: 31337,
        blockConfirmations: 1,
        // gasPrice: 130000000000,
    },
    sepolia: {
        url: SEPOLIA_RPC_URL,
        accounts: [PRIVATE_KEY],
        chainId: 11155111,
        blockConfirmations: 2,
        saveDeployments: true,
    },
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
        sepolia: ETHERSCAN_API_KEY,
        //polygon: POLYGONSCAN_API_KEY,
    },
    customChains: [
        {
            network: "goerli",
            chainId: 5,
            urls: {
                apiURL: "https://api-goerli.etherscan.io/api",
                browserURL: "https://goerli.etherscan.io",
            },
        },
    ],
  },
  mocha: {
    timeout: 500000, // 500 seconds max for running tests
  },
};

