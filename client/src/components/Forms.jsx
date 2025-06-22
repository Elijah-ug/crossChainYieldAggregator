import {NavLink, Outlet} from "react-router-dom"
import DepositForm from './DepositForm'
import WithdrawForm from './WithdrawForm'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { connectWallet } from '../features/sender/auth/walletThunk'

export default function Forms() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(connectWallet());
  }, []);
  return (
      <div>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className=" shadow-xl bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex text-center justify-center gap-6 py-2">
             <NavLink to="deposit" className="text-gray-800">Deposit</NavLink>
            <NavLink to="withdraw" className="text-gray-800">Withdraw</NavLink>
        </div>
        <Outlet/>

          {/* <DepositForm/>
          <WithdrawForm/> */}
    {/* <!-- Optional message --> */}
    <p className="text-sm text-gray-500 text-center mt-6">
      Make sure you're connected to the correct network.
    </p>
  </div>
 </div>

      </div>
  )
}
