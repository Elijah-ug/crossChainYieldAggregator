require("dotenv").config({path: "../.env"});
const axios = require("axios");
const { AbiCoder } = require("ethers");
const abiCoder = new AbiCoder();

// import { Functions } from "@chainlink/functions-toolkit";

const functionsToolkit = require("@chainlink/functions-toolkit");
const { Functions } = functionsToolkit;


  const getBestYield =  async (args) => {
    try {
        const response = await axios.get("https://yields.llama.fi/pools")
        const pools =  response.data.data;
        // console.log("Best poool: ", pools);
        // const targetProjects = ["aave", "compound", "geist", "venus"];
        const chainsToInclude = ["Polygon", "Ethereum", "Avalanche", "Base", "Arbitrum"];
        const filtered = pools.filter((pool) =>
           chainsToInclude.includes(pool.chain) &&
            pool.symbol.toLowerCase() === "usdc" &&
            pool.apyBase !== null
        );
        // console.log("filtered: ", filtered)
        if (filtered.length === 0) throw new Error("No APY data found.......");
        filtered.sort((a, b) => b.apyBase - a.apyBase);
        const best = filtered[0];
        const result = JSON.stringify({
          project: best.poolMeta || "Unknown Strategy",
          chain: best.chain,
          symbol: best.symbol,
          poolAddress: best.pool,
          apy: best.apyBase,
        });

        const encodedResult = abiCoder.encode(
          ["tuple(string project, string chain, string symbol, string poolAddress, uint256 apy)"],
          [[
            best.poolMeta ?? "Unknown Strategy",
            best.chain ?? "Unknown Chain",
            best.symbol ?? "USDC",
            best.pool ?? "0x0000000000000000000000000000000000000000",
            Math.round((best.apyBase ?? 0) * 1e4)
          ]]
        );

      // console.log("encodedResult", encodedResult)
      return encodedResult;

    } catch (error) {
        console.log("Error occured here", error);
        return

    }
 }
  module.exports = getBestYield;
