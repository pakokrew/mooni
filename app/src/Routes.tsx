import React from 'react'

import { Switch, Route, Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'

import './App.css'

import HomePage from './pages/HomePage'
import OrderPage from './pages/OrderPage'
import AccountPage from './pages/AccountPage'
import StatsPage from './pages/StatsPage'
import PaymentPage from './pages/PaymentPage'

import { getWalletStatus, isWalletLoading } from './redux/wallet/selectors'
import { WalletStatus } from './redux/wallet/state'
import Loader from './components/UI/Loader'

export const Routes: React.FC = () => {
  const walletStatus = useSelector(getWalletStatus)
  const walletLoading = useSelector(isWalletLoading)

  return (
    <Switch>
      <Route exact path="/">
        <HomePage />
      </Route>
      <Route exact path="/stats">
        <StatsPage />
      </Route>
      {walletStatus === WalletStatus.CONNECTED ? (
        <>
          <Route path="/account">
            <AccountPage />
          </Route>
          <Route path="/order">
            <OrderPage />
          </Route>
          <Route path="/payment">
            <PaymentPage />
          </Route>
        </>
      ) : (
        walletLoading && <Loader text="Loading Ethereum wallet" />
      )}
      {!walletLoading && (
        <Route path="*">
          <Redirect to="/" />
        </Route>
      )}
    </Switch>
  )
}
