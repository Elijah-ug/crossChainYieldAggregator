import React from 'react'
import { useDispatch, useSelector } from "react-redux";
import { connectWallet } from '../features/sender/auth/walletThunk';
export default function ConnectWallet() {
  const dispatch = useDispatch()
  const { address, chainId } = useSelector((state) => state.auth);
  console.log(address, chainId)
  return (
    <div>
      <div className="w-60 absolute right-4">

        {chainId && address? ( <div className="bg-amber-300 text-center rounded text-gray-900 py-1">
          {/* <p>Network: {chainId || "null"} </p> */}
          <p>Connected: {address.slice(0, 7)}...{address.slice(-4)} </p>
        </div> ) :
        ( <button onClick={() => dispatch(connectWallet())}
        className="bg-green-400 px-4 py-2 cursor-pointer rounded shadow">Connect Wallet</button> )}

      </div>
    </div>
  )
}
