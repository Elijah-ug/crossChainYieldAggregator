import React from 'react'
import {NavLink, Outlet} from "react-router-dom"
import DepositForm from './DepositForm'
import WithdrawForm from './WithdrawForm'

export default function Forms() {
  return (
      <div>
      <div class="min-h-screen flex items-center justify-center px-4">
        <div class=" shadow-xl bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex text-center justify-center gap-6 py-2">
             <NavLink to="deposit" className="text-gray-800">Deposit</NavLink>
            <NavLink to="withdraw" className="text-gray-800">Withdraw</NavLink>
        </div>
        <Outlet/>

          {/* <DepositForm/>
          <WithdrawForm/> */}
    {/* <!-- Optional message --> */}
    <p class="text-sm text-gray-500 text-center mt-6">
      Make sure you're connected to the correct network.
    </p>
  </div>
 </div>

      </div>
  )
}
