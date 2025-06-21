import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTriggerBestApy } from '../features/trigger/triggerApyThunk';
import { useEffect } from 'react';
import { fetchClientsThunk } from '../features/sender/clients/clientThunk';

export default function UserDashboard() {
  const dispatch = useDispatch();
  const { clients } = useSelector((state) => state.clients);
  console.log(clients)
  useEffect(() => {
    dispatch(fetchClientsThunk());
  }, [])

  return (
    <div>
      <h2 className="text-4xl font-bold text-amber-500 mt-4 text-center">Welcome To Your Dashboard</h2>
      <div className="mt-4">
        {
          clients.length > 0 ? (
            clients.map((client) => <div>
              <p>{client.user}</p>
              <p>{ client.balance}</p>
          </div> )
          ):
            (<p>No users available</p> )
        }
      </div>

    </div>
  )
}
