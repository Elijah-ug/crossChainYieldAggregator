import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { fetchDepositThunk } from '../features/sender/deposit/depositThunk';

export default function DepositForm() {
  const [amount, setAmount] = useState(null);
  const dispatch = useDispatch();
  const handleClick = async (e) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        dispatch(fetchDepositThunk({amount: parsedAmount}));
      } else {
        console.log("Invalid amount")
      }
  }
  return (
    <div >
        {/* <div class=" shadow-xl bg-white rounded-2xl p-8 max-w-md w-full"> */}
          <h2 class="text-lg font-bold text-gray-800  text-center">Deposit Funds </h2>
          <form onSubmit={handleClick} class="space-y-4 bg-white rounded p-4">
      {/* <!-- Amount --> */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount (ETH)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)}
            type="number" step="0.001" placeholder="Enter Amount"
               class="w-full px-4 py-2 border border-gray-300 text-gray-800 outline-none rounded-xl focus:outline-none "
                          />
      </div>

      {/* <!-- Submit Button --> */}
            <div class="pt-4">
              <button type="submit"
          class="w-full bg-blue-600 text-white cursor-pointer font-semibold py-2 px-4 rounded-xl hover:bg-blue-700 transition-all"
        >
          Deposit
        </button>
      </div>
          </form>

          </div>
        //   </div>
  )
}
