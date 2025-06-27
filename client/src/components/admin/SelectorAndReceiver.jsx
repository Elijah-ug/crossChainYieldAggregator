import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { fetchSetReceiverAndChain } from '../../features/sender/trigger/setReceiverThunk';


const admin = "0x34a579280ab83994Bc97E93189a30526160C20F9"

export default function SelectorAndReceiver() {
    const [receiver, setReceiver] = useState("0xBc19208b9A406dc44b4840D28B73E98A7c66B46C");
    const [selector, setSelector] = useState((parseInt("10344971235874465080")));
  const dispatch = useDispatch();
  const { address } = useSelector((state) => state.auth)
  // const chainSelector = BigInt("10344971235874465080");
  // const receiverAddress = "0xBc19208b9A406dc44b4840D28B73E98A7c66B46C"
  console.log("admin: " + admin)
    const handleSelectorAndReceiverSetting = (e) => {
      e.preventDefault();
      if (!receiver || receiver.length !== 42) {
        toast.error("Invalid receiver address");
        return;
      }
      if (!selector || isNaN(selector)) {
        toast.error("Invalid selector");
        return;
      }
      console.log(typeof (selector))
      dispatch(fetchSetReceiverAndChain({receiver, selector: BigInt(selector)}))
    }
  return (
      <div className="min-h-screen flex items-center justify-center px-4">
          <form onSubmit={handleSelectorAndReceiverSetting}
              className="space-y-4 bg-white rounded p-4 w-lg ml-20">
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Contract</label>
          <input value={receiver} onChange={(e) => setReceiver(e.target.value)}
            type="text"  placeholder="0x....."
               className="w-full px-4 py-2 border border-gray-300 text-gray-800 outline-none rounded-xl focus:outline-none "
                          />
              </div>

              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selector</label>
          <input value={selector} onChange={(e) => setSelector(e.target.value)}
            type="number"  placeholder="000000"
               className="w-full px-4 py-2 border border-gray-300 text-gray-800 outline-none rounded-xl focus:outline-none "
                          />
              </div>

            <div className="pt-4 mx-20">
              <button type="submit"
          className="w-full bg-blue-600 text-white cursor-pointer font-semibold py-2 px-4 rounded-xl hover:bg-blue-700 transition-all"
        >
          Deposit
        </button>
      </div>
          </form>
    </div>
  )
}
