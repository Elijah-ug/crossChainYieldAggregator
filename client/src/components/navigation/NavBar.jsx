import React from 'react'
import { NavLink } from 'react-router-dom'

export default function NavBar() {
  return (
    <div className="flex items-center justify-between py-3 bg-gray-700 shadow-2xl px-16">
      <div className="text-lg cursor-pointer">
        <h2>CCIP</h2>
      </div>
      <div className="flex gap-10 ">
       <NavLink to="/">Home</NavLink>
        <NavLink to="user-dashboard">User Dashboard</NavLink>
        <NavLink to="deposit-withdraw">Deposit/Withdraw</NavLink>
        </div>


    </div>
  )
}
