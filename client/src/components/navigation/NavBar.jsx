import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'

export default function NavBar() {
  // const [onlyAdmin, setOnlyAdmin] = useState(false)
  const { address } = useSelector((state) => state.auth);
  const admin = "0x34a579280ab83994Bc97E93189a30526160C20F9";
  console.log("Admin: " + admin);
  console.log("user: " + address);
  const onlyAdminSetting = address?.toLowerCase() === admin.toLowerCase();
  console.log("user: " + onlyAdminSetting);

  return (
    <div className="flex items-center justify-between py-3 bg-gray-700 shadow-2xl px-16">
      <div className="text-lg cursor-pointer">
        <h2>CCIP</h2>
      </div>
      <div className="flex gap-10 ">
       <NavLink to="/">Home</NavLink>
        <NavLink to="user-dashboard">User Dashboard</NavLink>
        <NavLink to="deposit-withdraw">Deposit/Withdraw</NavLink>
        {onlyAdminSetting && (<NavLink to="settings">Selector And Receiver</NavLink>)}
        </div>


    </div>
  )
}
