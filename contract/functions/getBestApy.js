require("dotenv").config({path: "../.env"});
const axios = require("axios");
// import { Functions } from "@chainlink/functions-toolkit";
const functionsToolkit = require("@chainlink/functions-toolkit");
const { Functions } = functionsToolkit;

// const PRIVATE_KEY="0xbc468efbbcebf6f7e737f66fdeb469b8695cd37f07cf80b30f87ce5babf5ffb2"


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
            preferredStrategy: best.poolMeta || "Unknown Strategy",
            chain: best.chain,
            apy: best.apyBase,
            symbol: best.symbol,
            poolAddress: best.pool,
          });
          console.log("Private key", process.env.ETHEREUM_SEPOLIA_RPC_URL)
         console.log("Encoded Result: ", result);
        const encodedResult = Buffer.from(JSON.stringify(result)).toString("base64");
        console.log("encodedResult: ", encodedResult)
         return encodedResult;

        // return Functions.encodeString(JSON.stringify(result));
    } catch (error) {
        console.log("Error occured here", error);
        return Functions.encodeString("error")
    }
 }
  module.exports = getBestYield();
// export default async function handler(req, res) {
//     return await getBestYield();
// }
