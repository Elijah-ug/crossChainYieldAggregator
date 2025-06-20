import React from 'react'
import "./App.css"
import { Route, Routes } from 'react-router-dom'
import Home from './components/Home'
import UserDashboard from './components/UserDashboard'
import NavBar from './components/navigation/NavBar'
import Forms from './components/Forms'
import DepositForm from './components/DepositForm'
import WithdrawForm from './components/WithdrawForm'
export default function App() {
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

      </Routes>
    </div>
  )
}
