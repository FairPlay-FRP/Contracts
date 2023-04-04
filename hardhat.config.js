require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()
require("hardhat-abi-exporter");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-interface-generator");
require('solidity-coverage');
require('hardhat-contract-sizer');
require('@openzeppelin/hardhat-upgrades');
require("@tenderly/hardhat-tenderly");
require('hardhat-ignore-warnings');

module.exports = {
    networks: {
        hardhat: {
            // forking: {
            //     url: "https://api.avax-test.network/ext/bc/C/rpc",
            //     gasPrice: 25000000000,
            //     blockNumber: 10186172
            // },
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [
                {
                    privateKey: process.env.DEPLOYER_PRIVATE_KEY,
                    balance: "10000000000000000000000"
                },
                {
                    privateKey: process.env.DAO_PRIVATE_KEY,
                    balance: "10000000000000000000000"
                },
                {
                    privateKey: process.env.DEV_PRIVATE_KEY,
                    balance: "10000000000000000000000"
                }] : [],
        },
        ropsten: {
            url: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY, process.env.DAO_PRIVATE_KEY, process.env.DEV_PRIVATE_KEY] : [],
        },
        mainnet: {
            url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY, process.env.DAO_PRIVATE_KEY, process.env.DEV_PRIVATE_KEY] : [],
        },
        goerli: {
          url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
          accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY, process.env.DAO_PRIVATE_KEY, process.env.DEV_PRIVATE_KEY] : [],
        },
        polygon: {
            url: "https://polygon-rpc.com/",
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY, process.env.DAO_PRIVATE_KEY, process.env.DEV_PRIVATE_KEY] : [],
        },
        polygonMumbai: {
            url: "https://matic-mumbai.chainstacklabs.com/",
            accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY, process.env.DAO_PRIVATE_KEY, process.env.DEV_PRIVATE_KEY] : [],
        }
    },
    etherscan: {
        apiKey: process.env.SCAN_API_KEY
    },
    solidity: {
        compilers: [{
            version: "0.8.9",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                },
                outputSelection: {
                    "*": {
                        "*": ["storageLayout",
                            "metadata"]
                    }
                }
            }
        }, {
            version: "0.8.4",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            },
            outputSelection: {
                "*": {
                    "*": ["storageLayout"]
                }
            }
        }, {
            version: "0.8.7",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }
        ],
    },
    abiExporter: [
        {
            path: './abi/pretty',
            pretty: true,
        },
        {
            path: './abi/ugly',
            pretty: false,
        },
    ],
    // warnings: {
    //     '*': {
    //         'func-mutability': false, // solc-ignore-next-line not working, temporary fix
    //         default: 'warn',
    //     },
    // },
    tenderly: {
        project: "Project",
        username: "GameTheory",
    }
}