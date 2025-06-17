require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ethereumSepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },

    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
  }
};
