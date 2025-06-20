import React, { useEffect } from 'react'
import ConnectWallet from './ConnectWallet'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBestYieldData } from '../features/sender/yield/yieldThunk';
import { fetchTriggerBestApy } from '../features/trigger/triggerApyThunk';

export default function Home() {
  const dispatch = useDispatch();
  const { loading, bestYield, error } = useSelector((state) => state.yield);
  console.log("best bestYield", bestYield.apy)
  useEffect(() => {
    dispatch(fetchBestYieldData())

  }, [])
  const handleUpdateYield = async () => {
    try {
      const res = await fetch("http://localhost:5000/update-yield", { method: "POST" });
      const data = await res.json();
      console.log(data)
    } catch (error) {

    }
  }
  return (
    <div className="">
      <h2 className="text-xl font-bold text-amber-500 text-center mt-10"
      >Cross-Chain Yield Aggregator, Powered by Chainlink</h2>
      <div className="">
        <ConnectWallet/>
      </div>
      <button onClick={handleUpdateYield}
      className="bg-amber-400 text-gray-700 px-4 py-2 cursor-pointer rounded shadow">Get Best</button>

      <div className=" p-6 flex items-center justify-center mt-10">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">

    {/* <!-- Card 1: How Aggregator Works --> */}
    <div className="bg-indigo-500 shadow-2xl rounded-2xl p-6 text-white">
      <h2 className="text-xl font-bold  mb-4">⚙️ How It Works</h2>
      <p className=" leading-relaxed">
              This platform helps you earn the highest possible yield on your USDC by automatically
              scanning multiple DeFi protocols like Aave and Compound, selecting the one with the best APY,
              and depositing your funds there. It uses Chainlink CCIP for cross-chain transfers,
              Chainlink Functions to fetch real-time APY data, and Chainlink Automation to handle deposits
              and strategy updates — all fully automated, secure, and optimized so your money always works
              harder without you lifting a finger.      </p>
    </div>

    {/* <!-- Card 2: Project Data --> */}
    <div className="bg-violet-800 shadow-2xl rounded-2xl p-6 text-white">
      <h2 className="text-xl font-bold mb-4">📊 Top APY Project Pool Info (Live)</h2>
      <div className="space-y-2 ">
        <p className="text-amber-600"><span className="font-medium mr-4">Project:</span> {bestYield.project}</p>
        <p className="text-amber-600"><span className="font-medium mr-4">Chain:</span> {bestYield.chain}</p>
        <p className="text-amber-600"><span className="font-medium mr-4">Symbol:</span> {bestYield.symbol}</p>
        <p className="text-amber-600"><span className="font-medium mr-4">Pool Address:</span> {bestYield.poolAddress}</p>
        <p className="text-amber-600"><span className="font-medium mr-4">APY:</span> {bestYield.apy}%</p>
      </div>
    </div>

  </div>
</div>

    </div>
  )
}
