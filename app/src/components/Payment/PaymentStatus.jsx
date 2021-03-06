import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import { Box, List, ListItem } from '@material-ui/core'
import {
  Button,
  LoadingRing,
  IconCheck,
  IconExternal,
  useTheme,
  textStyle,
  IconWarning,
  IconEllipsis,
  GU,
  IconClock,
  Info,
} from '@aragon/ui'
import styled from 'styled-components'
import { useMediaQuery, Tooltip } from '@chakra-ui/react'
import { QuestionOutlineIcon } from '@chakra-ui/icons'

import { RoundButton } from '../UI/StyledComponents'
import { EmailButton } from '../UI/Tools'

import { getEtherscanTxURL } from '../../lib/eth'
import Bity from '../../lib/wrappers/bity'
import { PaymentStatus, PaymentStepId, PaymentStepStatus } from '../../lib/types'
import { watchBityOrder, unwatch, resetOrder } from '../../redux/payment/actions'
import { selectUser } from '../../redux/user/userSlice'

const SubTitle = styled.p`
  ${textStyle('title4')};
  text-align: center;
  margin-bottom: ${2 * GU}px;
`

const Hint = styled.p`
  ${textStyle('body3')};
  margin-bottom: ${2 * GU}px;
  padding: 0 1rem;
  text-align: center;
`
const StatusLabel = styled.span`
  ${textStyle('label2')};
  white-space: nowrap;
`
const StatusSecondary = styled.span`
  ${textStyle('label2')};
  font-style: italic;
  font-size: 10px;
`
const ErrorMessage = styled.p`
  ${textStyle('body3')};
`

const StatusListItem = styled(ListItem)`
  border: 1px solid #f9fafc;
  background-color: #ffffffc9;
  margin-bottom: 6px;
  border-left: 1px solid white;
  padding: 13px;
  border-radius: 11px;
  box-shadow: 1px 1px 7px rgba(145, 190, 195, 0.16);
`

function PaymentOngoingInfo({ payment }) {
  const ongoing = payment.status === PaymentStatus.ONGOING
  const bityStep = payment.steps.find((s) => s.id === PaymentStepId.BITY)
  const waitingBity = bityStep && bityStep.status === PaymentStepStatus.RECEIVED
  const miningStep = payment.steps.find((s) => s.status === PaymentStepStatus.MINING)

  return (
    <Box>
      {miningStep && (
        <Box mb={2}>
          <Info mode="info">
            Your transaction is validating. Please <b>do not speed up</b> the transaction in your wallet.
          </Info>
        </Box>
      )}
      {ongoing && waitingBity ? (
        <Hint>
          Your payment has been received and the bank transfer is being sent. This process can take up to 10 minutes.
        </Hint>
      ) : (
        <Info mode="warning">Please do not close this tab until the process is complete.</Info>
      )}
    </Box>
  )
}

function PaymentSuccessInfo() {
  const dispatch = useDispatch()
  const history = useHistory()
  const user = useSelector(selectUser)
  const referralURL = `${window.location.origin}?referralId=${user.referralId}`
  const tweetURL = `https://twitter.com/intent/tweet?text=I've%20just%20cashed%20out%20my%20crypto%20with%20Mooni%20in%20minutes!&via=moonidapp&url=${referralURL}&hashtags=defi,offramp,crypto`

  function onGoHome() {
    dispatch(resetOrder())
    history.push('/')
  }

  return (
    <Box width={1}>
      <SubTitle>
        That's a success{' '}
        <span role="img" aria-label="alright">
          👌
        </span>
      </SubTitle>
      <Hint>
        The payment is complete and the bank transfer has been sent. <br />
        Funds will arrive in your bank account between one hour and four days from now, depending on your bank.
      </Hint>
      <Box mb={1}>
        <RoundButton
          mode="normal"
          onClick={() => window.open(tweetURL)}
          wide
          label="Share on twitter"
          icon={
            <span role="img" aria-label="love">
              ❤️
            </span>
          }
        />
      </Box>
      <RoundButton mode="strong" onClick={onGoHome} wide label="Close" />
    </Box>
  )
}

function getPaymentStepMessage(error) {
  let message = 'Unknown error.'

  if (error.message === 'user-rejected-transaction') message = 'You refused the transaction in your wallet.'
  else if (error.message === 'token-balance-too-low') message = 'Your token balance is too low.'
  else if (error.message === 'bity-order-cancelled') message = 'The order has been cancelled.'
  else if (error.message === 'low-balance-for-gas') message = 'You do not have enough ETH to pay for gas.'
  else if (error.message === 'order_canceled_not_paying')
    message = 'Order is expired or has been cancelled, not sending payment. Please retry.'

  return message
}

function PaymentErrorInfo({ payment }) {
  const dispatch = useDispatch()
  const history = useHistory()

  function onRestart() {
    dispatch(resetOrder())
    history.push('/order')
  }

  const stepsWithError = payment.steps.filter((step) => !!step.error)

  return (
    <Box width={1}>
      <SubTitle>
        Oops, something went wrong{' '}
        <span role="img" aria-label="oops">
          🤭
        </span>
      </SubTitle>
      {stepsWithError.length > 0 && (
        <>
          <Info mode="error" style={{ paddingTop: 0, paddingBottom: 0 }}>
            {stepsWithError.map((step) => (
              <Box key={step.id} py={1}>
                <StatusLabel>
                  {step.id === PaymentStepId.ALLOWANCE && 'Token allowance'}
                  {step.id === PaymentStepId.TRADE && 'Token exchange'}
                  {step.id === PaymentStepId.PAYMENT && 'Payment'}
                  {step.id === PaymentStepId.BITY && 'Fiat exchange'}
                </StatusLabel>
                <ErrorMessage>{getPaymentStepMessage(step.error)}</ErrorMessage>
              </Box>
            ))}
          </Info>
          <Box mt={2} />
        </>
      )}
      <RoundButton mode="strong" onClick={onRestart} wide label="Close" />
      <Box mt={2} display="flex" justifyContent="center">
        <EmailButton bg="white" label="Contact support" />
      </Box>
    </Box>
  )
}

function ExternalButton({ url, label }) {
  const [isSmall] = useMediaQuery('(max-width: 960px)')
  const theme = useTheme()

  let display = 'all'
  const style = {}
  if (isSmall) {
    display = 'icon'
    style.width = '50px'
  } else {
    style.width = '110px'
  }

  return (
    <Button
      href={url}
      style={style}
      size="mini"
      display={display}
      icon={<IconExternal style={{ color: theme.accent }} />}
      label={label}
    />
  )
}

function StatusRow({ id, status, txHash, bityOrderId }) {
  const dispatch = useDispatch()
  const theme = useTheme()

  let color
  if (status === PaymentStepStatus.DONE) color = theme.positive
  if (status === PaymentStepStatus.ERROR) color = theme.negative
  if (status === PaymentStepStatus.APPROVAL) color = theme.infoSurfaceContent
  if (status === PaymentStepStatus.QUEUED) color = theme.disabledContent
  if (status === PaymentStepStatus.MINING) color = theme.warningSurfaceContent
  if (status === PaymentStepStatus.WAITING) color = theme.warningSurfaceContent
  if (status === PaymentStepStatus.RECEIVED) color = theme.warningSurfaceContent

  let borderLeftColor
  if (status === PaymentStepStatus.DONE) borderLeftColor = '#9de2c9'
  if (status === PaymentStepStatus.ERROR) borderLeftColor = theme.negative
  if (status === PaymentStepStatus.APPROVAL) borderLeftColor = theme.infoSurfaceContent
  if (status === PaymentStepStatus.QUEUED) borderLeftColor = '#c8d7e4'
  if (status === PaymentStepStatus.MINING) borderLeftColor = '#ead4ae'
  if (status === PaymentStepStatus.WAITING) borderLeftColor = '#ead4ae'
  if (status === PaymentStepStatus.RECEIVED) borderLeftColor = '#ead4ae'

  let backgroundColor = theme.surface
  if (status === PaymentStepStatus.DONE) backgroundColor = '#f1fbf8'

  useEffect(() => {
    if (bityOrderId) {
      dispatch(watchBityOrder(bityOrderId))
      return () => dispatch(unwatch(bityOrderId))
    }
  }, [dispatch, bityOrderId])

  return (
    <StatusListItem disableGutters style={{ borderLeftColor, backgroundColor }}>
      <Box display="flex" width={1} alignItems="center">
        <Box width={24} mr={1} display="flex" justifyContent="center">
          {status === PaymentStepStatus.MINING && <LoadingRing />}
          {status === PaymentStepStatus.WAITING && <LoadingRing />}
          {status === PaymentStepStatus.RECEIVED && <LoadingRing />}
          {status === PaymentStepStatus.DONE && <IconCheck size="medium" style={{ color }} />}
          {status === PaymentStepStatus.ERROR && <IconWarning size="medium" style={{ color }} />}
          {status === PaymentStepStatus.APPROVAL && <IconClock size="medium" style={{ color }} />}
          {status === PaymentStepStatus.QUEUED && <IconEllipsis size="medium" style={{ color }} />}
        </Box>
        <Box flex={1} display="flex" alignItems="center">
          <StatusLabel>
            {id === PaymentStepId.ALLOWANCE && 'Token allowance'}
            {id === PaymentStepId.TRADE && 'Token exchange'}
            {id === PaymentStepId.PAYMENT && 'Payment'}
            {id === PaymentStepId.BITY && 'Fiat exchange'}
          </StatusLabel>
          <Box display="flex" alignItems="center" ml={1}>
            <StatusSecondary>
              {status === PaymentStepStatus.MINING && <span style={{ color }}>Mining</span>}
              {status === PaymentStepStatus.WAITING && <span style={{ color }}>Confirming</span>}
              {status === PaymentStepStatus.RECEIVED && <span style={{ color }}>Sending</span>}
              {status === PaymentStepStatus.ERROR && <span style={{ color }}>Error</span>}
              {status === PaymentStepStatus.APPROVAL && <span style={{ color }}>Approval</span>}
            </StatusSecondary>
            {status === PaymentStepStatus.APPROVAL && (
              <Box ml={1}>
                <Tooltip label="We are waiting for you to accept a transaction in your wallet." fontSize="md">
                  <QuestionOutlineIcon />
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
        {txHash && <ExternalButton url={getEtherscanTxURL(txHash)} label="Transaction" />}
        {bityOrderId && <ExternalButton url={Bity.getOrderStatusPageURL(bityOrderId)} label="Bity order" />}
      </Box>
    </StatusListItem>
  )
}

export default function PaymentStatusComponent({ payment }) {
  return (
    <Box width={1}>
      <Box mb={2}>
        <List>
          {payment.steps.map((step) => (
            <StatusRow
              key={step.id}
              id={step.id}
              status={step.status}
              txHash={step.txHash}
              bityOrderId={step.bityOrderId}
            />
          ))}
        </List>
      </Box>

      {payment.status === PaymentStatus.ONGOING && <PaymentOngoingInfo payment={payment} />}
      {payment.status === PaymentStatus.ERROR && <PaymentErrorInfo payment={payment} />}
      {payment.status === PaymentStatus.DONE && <PaymentSuccessInfo />}
    </Box>
  )
}
