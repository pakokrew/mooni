import React from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'

import { Box } from '@chakra-ui/react'

import { setExchangeStep, setTradeRequest } from '../redux/payment/actions'
import { SmallWidth } from '../components/UI/StyledComponents'
import RateForm from '../components/Order/RateForm'
import { getMultiTradeRequest } from '../redux/payment/selectors'
import { getWalletStatus } from '../redux/wallet/selectors'
import { WalletStatus } from '../redux/wallet/state'
import { ReferralBox } from '../components/Account/ReferralInfo'
import { Surface } from '../components/UI/StyledComponents'

export const HeadLine = styled.h2`
  margin-top: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
`

export default function HomePage() {
  const history = useHistory()
  const dispatch = useDispatch()
  const { tradeRequest } = useSelector(getMultiTradeRequest)
  const walletStatus = useSelector(getWalletStatus)

  const onSubmit = (tradeRequest) => {
    dispatch(setTradeRequest(tradeRequest))
    dispatch(setExchangeStep(1))
    history.push('/order')
  }

  return (
    <SmallWidth>
      <Box w="100%">
        <HeadLine>Convert cryptocurrencies from your blockchain wallet into fiat to your bank account.</HeadLine>
        <Surface px={4} py={8} boxShadow="medium">
          <RateForm onSubmit={onSubmit} initialTradeRequest={tradeRequest} />
        </Surface>
        {walletStatus === WalletStatus.CONNECTED && (
          <Box mt={8}>
            <ReferralBox />
          </Box>
        )}
      </Box>
    </SmallWidth>
  )
}
