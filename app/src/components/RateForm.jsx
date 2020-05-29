import React from 'react';
import BN from 'bignumber.js';

import { Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useSelector } from 'react-redux';

import { LoadingRing, textStyle, Button, IconRefresh } from '@aragon/ui'
import styled from 'styled-components';

import AmountRow from './AmountRow';

import { TradeExact } from '../lib/types';

import { getInputCurrencies } from '../redux/ui/selectors';

import {
  FIAT_CURRENCIES,
  SIGNIFICANT_DIGITS,
} from '../lib/currencies';
import { useRate } from '../hooks/rates';

const InvalidMessage = styled.p`
  ${textStyle('body4')};
  color: #e61b1b;
`;

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(3),
  },
  additionalInfo: {
    height: 46,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.secondary,
  },
}));

const outputCurrencies = FIAT_CURRENCIES;

function RateForm({ onSubmit = () => null, initialRateRequest, buttonLabel = 'Exchange', buttonIcon = <IconRefresh /> }) {
  const classes = useStyles();
  const inputCurrencies = useSelector(getInputCurrencies);
  const { rateForm, onChangeAmount, onChangeCurrency, rateRequest } = useRate(initialRateRequest);

  let rate, feeAmount;
  if(rateForm) {
    rate = new BN(rateForm.values.outputAmount).div(rateForm.values.inputAmount).sd(SIGNIFICANT_DIGITS).toFixed();
  }

  if(rateForm.values.fees) {
    if(outputCurrencies.includes(rateForm.values.fees.currency)) {
      feeAmount = new BN(rateForm.values.fees.amount).dp(2).toFixed();
    } else {
      feeAmount = new BN(rateForm.values.fees.amount).sd(SIGNIFICANT_DIGITS).toFixed();
    }
  }

  function submit() {
    if(!rateForm.valid || rateForm.loading) return;
    onSubmit(rateRequest);
  }

  return (
    <Box py={1}>
      <AmountRow
        value={rateForm.values.inputAmount}
        currencies={inputCurrencies}
        currency={rateForm.values.inputCurrency}
        onChangeCurrency={onChangeCurrency(TradeExact.INPUT)}
        onChangeValue={onChangeAmount(TradeExact.INPUT)}
        active={rateForm.values.tradeExact === TradeExact.INPUT}
        caption="Send"
      />
      <AmountRow
        value={rateForm.values.outputAmount}
        currencies={outputCurrencies}
        currency={rateForm.values.outputCurrency}
        onChangeCurrency={onChangeCurrency(TradeExact.OUTPUT)}
        onChangeValue={onChangeAmount(TradeExact.OUTPUT)}
        active={rateForm.values.tradeExact === TradeExact.OUTPUT}
        caption="Receive"
      />

      <Box className={classes.additionalInfo}>
        {!rateForm.loading ?
          rateForm.valid ?
            <Typography variant="caption">
              <b>Rate:</b> {rate} {rateForm.values.outputCurrency}/{rateForm.values.inputCurrency}
              {feeAmount && <span><br/><b>Fees:</b> {feeAmount} {rateForm.values.fees.currency}</span>}
            </Typography>
            :
            <InvalidMessage>
              {rateForm.errors.lowBalance && 'Insufficient balance'}
              {rateForm.errors.lowBalance && rateForm.errors.lowAmount && <br/>}
              {rateForm.errors.lowAmount && 'Output amount too low'}
            </InvalidMessage>
          :
          <LoadingRing/>
        }
      </Box>
      <Button mode="strong" onClick={submit} wide icon={buttonIcon} label={buttonLabel} disabled={!rateForm.valid || rateForm.loading} />
    </Box>
  );
}

export default RateForm;
