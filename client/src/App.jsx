import React, { useEffect } from 'react'
import "./App.css"
import { Route, Routes } from 'react-router-dom'
import Home from './components/Home'
import UserDashboard from './components/UserDashboard'
import NavBar from './components/navigation/NavBar'
import Forms from './components/Forms'
import DepositForm from './components/DepositForm'
import WithdrawForm from './components/WithdrawForm'
import SelectorAndReceiver from './components/admin/SelectorAndReceiver'
import { useDispatch } from 'react-redux'
import { autoConnectWallet } from './features/wallet/auth/walletThunk'
export default function App() {
  const dispatch = useDispatch();

  useEffect((state) => {
    dispatch(autoConnectWallet());
  })
  return (
    <div>
      <NavBar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="user-dashboard" element={<UserDashboard />} />
        <Route path="deposit-withdraw" element={<Forms />}>
        <Route path="deposit" element={<DepositForm />} />
        <Route path="withdraw" element={<WithdrawForm/> } />
        </Route>
        <Route path="settings" element={<SelectorAndReceiver/> } />

      </Routes>
    </div>
  )
}
