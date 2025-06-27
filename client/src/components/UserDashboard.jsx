import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react';
import { fetchClientsThunk } from '../features/sender/clients/clientThunk';
import LatestYield from './LatestYield';
import { fetchBestReceiverYield } from '../features/receiver/yield/bestYieldThunk';
import { fetchGetBalance } from '../features/receiver/thunks/getBalanceThunk';
import { fetchRegisterUser } from '../features/sender/register/registerUserThunk';

export default function UserDashboard() {
  const dispatch = useDispatch();
  const { clients } = useSelector((state) => state.clients);
  const { address } = useSelector((state) => state.auth);
  console.log("address: ", clients);
  useEffect(() => {
    dispatch(fetchClientsThunk());
    dispatch(fetchGetBalance(address));
  }, [])
  const isClient = clients?.some((client) => client?.user?.toLowerCase() === address?.toLowerCase());
  console.log("isClient: " + isClient)
  return (
    <div>
      <h2 className="text-4xl font-bold text-amber-500 mt-4 text-center">Welcome To Your Dashboard</h2>
      <div className="flex justify-center mt-6">
      {!isClient && (<button onClick={() => dispatch(fetchRegisterUser())}
        className="bg-violet-500 text-white px-8 py-2 cursor-pointer rounded shadow ">Join Users Here
        </button>)}
      </div>
      <div className="mt-10 mx-20 flex justify-around">
        {isClient &&(
          <div className=" bg-indigo-500 shadow-indigo-400 shadow-md rounded-xl w-lg p-6 text-white">
        {
          clients.length > 0 && (
            clients.map((client, index) =>
              <div key={index}>
                <div >
                  <p>
                     {client?.user?.toLowerCase() === address?.toLowerCase() ?
                    ("User: " + `${client?.user?.slice(0, 7)} ` + "..." + `${client?.user?.slice(-5)}`): null}</p>
                  <p>
                    {client?.user?.toLowerCase() === address?.toLowerCase() ?
                      ("Balance: " + client.balance) : ""}</p>
                </div>
                </div>)
          )
          }
          </div>)}
        <div className=" bg-amber-800 shadow-amber-600 shadow-md rounded-xl w-lg p-6 text-white">
          <h3 className="text-center">User's Yield Farming Details</h3>
          <p>Project: <span className="ml-2"></span></p>
          <p>Currecy: <span className="ml-2"></span></p>
          <p>Pool Address: <span className="ml-2"></span></p>
          <p>Pool APY: <span className="ml-2"></span></p>
        </div>
      </div>
      {/* <LatestYield/> */}
    </div>
  )
}
