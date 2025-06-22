import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBestReceiverYield } from '../features/receiver/yield/bestYieldThunk';
import { fetchGetBalance } from '../features/receiver/thunks/getBalanceThunk';

export default function LatestYield() {
    const { address } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchBestReceiverYield());
        dispatch(fetchGetBalance({address}));
    }, [])
  return (
    <div>LatestYield</div>
  )
}
