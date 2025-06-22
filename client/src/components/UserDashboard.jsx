import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTriggerBestApy } from '../features/trigger/triggerApyThunk';
import { useEffect } from 'react';
import { fetchClientsThunk } from '../features/sender/clients/clientThunk';
import LatestYield from './LatestYield';
import { fetchBestReceiverYield } from '../features/receiver/yield/bestYieldThunk';
import { fetchGetBalance } from '../features/receiver/thunks/getBalanceThunk';
import { connectWallet } from '../features/sender/auth/walletThunk';

export default function UserDashboard() {
  const dispatch = useDispatch();
  const { clients } = useSelector((state) => state.clients);
  const { address } = useSelector((state) => state.auth);
  console.log("address: ", address)
  useEffect(() => {
    dispatch(fetchClientsThunk());
    dispatch(fetchGetBalance({address}))
    dispatch(connectWallet())
  }, [])
  // dispatch(fetchBestReceiverYield())
  // dispatch(fetchClientsThunk());

  return (
    <div>
      <h2 className="text-4xl font-bold text-amber-500 mt-4 text-center">Welcome To Your Dashboard</h2>
      <div className="mt-4">
        {
          clients.length > 0 ? (
            clients.map((client, index) => <div key={index}>
              <p>{client.user}</p>
              <p>{ client.balance}</p>
          </div> )
          ):
            (<p>No users available</p> )
        }
      </div>
      <LatestYield/>
    </div>
  )
}
