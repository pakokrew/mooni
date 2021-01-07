import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Loader from '../components/Loader';
import { Box } from '@material-ui/core';
import { EmptyStateCard, Button } from '@aragon/ui'

import { getETHManager, getWalletStatus } from '../redux/wallet/selectors';
import { login } from '../redux/wallet/actions';

import LoadImage from '../assets/undraw_counting_stars_rrnl.svg';

function RequireConnection({ children }) {
  const ethManager = useSelector(getETHManager);
  const ethManagerLoading = useSelector(getWalletStatus);
  const dispatch = useDispatch();

  function login() {
    dispatch(login());
  }

  if(ethManager)
    return children;

  if(ethManagerLoading)
    return <Loader text="Loading Ethereum wallet" />;

  if(!ethManager) {
    return (
      <Box display="flex" justifyContent="center">
        <EmptyStateCard
          text="Please connect your Ethereum wallet"
          illustration={<img src={LoadImage} width="80%" alt="" />}
          action={<Button onClick={login}>Connect</Button>}
        />
      </Box>
    );
  }

  return children;
}

export default RequireConnection;
