import React from 'react'
import { useDispatch } from 'react-redux'
import { fetchTriggerBestApy } from '../features/trigger/triggerApyThunk';

export default function UserDashboard() {
  const dispatch = useDispatch();

  return (
    <div>
      <h2 className="text-4xl font-bold text-amber-500 mt-4 text-center">Welcome To Your Dashboard</h2>
      <button onClick={() => dispatch(fetchTriggerBestApy())}
      className="bg-green-400 px-4 py-2 cursor-pointer rounded shadow"> Trigger Best APY Update</button>

    </div>
  )
}
