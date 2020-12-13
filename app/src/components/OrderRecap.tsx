import React from 'react';
import styled from 'styled-components';

import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import BN from 'bignumber.js';
import { Link, textStyle, Field, GU, Info, Timer } from '@aragon/ui';

import { getCurrencyLogoAddress } from '../lib/trading/currencyHelpers';
import { SIGNIFICANT_DIGITS } from '../lib/numbers';

import bityLogo from '../assets/bity_logo_blue.svg';
import {BityTrade, MultiTrade, TradeType} from "../lib/trading/types";
import RateAmount from "./RateAmount";

const useStyles = makeStyles(theme => ({
  root: {
    paddingBottom: theme.spacing(1),
  },
  caption: {
    paddingLeft: 22,
    color: theme.palette.text.secondary,
  },
  rowRoot: {
    border: '1px solid black',
    borderWidth: '1px',
    paddingLeft: theme.spacing(2),
    borderColor: theme.palette.divider,
    paddingRight: theme.spacing(2),
    display: 'flex',
    borderRadius: 30,
    height: 48,
    alignItems: 'center',
    backgroundColor: theme.palette.background.default,
    boxShadow: '1px 1px 7px rgba(47, 36, 36, 0.09)',
  },
  amountInput: {
    border: 'none',
    width: '100%',
    textAlign: 'start',
    height: 35,
    padding: theme.spacing(0, 1),
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.default,
    '&:focus': {
      outline: 'none',
    }
  },
  currencySelector: {
    width: 86,
  },
  recipientField: {
    marginBottom: 10,
  }
}));

const Value = styled.p`
  ${textStyle('body3')};
`;

const PoweredBy = styled.span`
  ${textStyle('label2')};
  margin-right: ${0.5 * GU}px;
`;

function RecipientRow({ label, value }) {
  const classes = useStyles();
  return (
    <Field label={label} className={classes.recipientField}>
      <Value data-private>{value}</Value>
    </Field>
  )
}

function AmountRow({ value, symbol, caption }) {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Box className={classes.caption}>
        <Typography variant="caption">
          {caption}
        </Typography>
      </Box>
      <Box className={classes.rowRoot}>
        <Box flex={1}>
          <input
            type="number"
            min={0}
            value={new BN(value).sd(SIGNIFICANT_DIGITS).toFixed()}
            readOnly
            className={classes.amountInput}
          />
        </Box>
        <Box className={classes.currencySelector}>
          <Box display="flex" alignItems="center">
            <img
              src={getCurrencyLogoAddress(symbol)}
              alt={`coin-icon-${symbol}`}
              width={20}
            />
            <Box ml={1}>{symbol}</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function OrderRecap({ multiTrade }: { multiTrade: MultiTrade }) {
  const bankInfo = multiTrade.multiTradeRequest.bankInfo;
  if(!bankInfo) throw new Error('missing bank info in OrderRecap');
  const {recipient, reference} = bankInfo;

  let fullAddress = '';
  if(recipient.owner?.address) {
    fullAddress += recipient.owner.address;
  }
  if(recipient.owner?.zip) {
    fullAddress += ', ' + recipient.owner.zip;
  }
  if(recipient.owner?.city) {
    fullAddress += ', ' + recipient.owner.city;
  }
  if(recipient.owner?.country) {
    fullAddress += ', ' + recipient.owner.country;
  }

  const inputAmount = multiTrade.inputAmount;
  const outputAmount = multiTrade.outputAmount;
  const inputCurrency = multiTrade.multiTradeRequest.tradeRequest.inputCurrency;
  const outputCurrency = multiTrade.multiTradeRequest.tradeRequest.outputCurrency;

  const rate = new BN(outputAmount).div(inputAmount).sd(SIGNIFICANT_DIGITS).toFixed();

  const bityTrade = multiTrade.trades.find(t => t.tradeType === TradeType.BITY) as BityTrade;
  const orderExpireDate = new Date(bityTrade.bityOrderResponse.timestamp_price_guaranteed);

  return (
    <Box>
      <Box px={1}>
        <RecipientRow label="Name" value={recipient.owner.name}/>
        {fullAddress && <RecipientRow label="Address" value={fullAddress}/>}

        <RecipientRow label="IBAN" value={recipient.iban}/>
        {recipient.bic_swift && <RecipientRow label="BIC" value={recipient.bic_swift}/>}
        {reference && <RecipientRow label="Reference" value={reference}/>}
        {recipient.email && <RecipientRow label="Contact email" value={recipient.email}/>}
      </Box>

      <AmountRow value={inputAmount} symbol={inputCurrency.symbol} caption="You send" />
      <AmountRow value={outputAmount} symbol={outputCurrency.symbol} caption="You receive" />

      <RateAmount multiTrade={multiTrade}/>

      <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
        <PoweredBy>Powered by </PoweredBy>
        <Link external href="https://bity.com"><img src={bityLogo} alt="bity" width={70} /></Link>
      </Box>

      <Box pt={1}>
        <Info title="Price guaranteed for" mode="warning">
          <Timer end={orderExpireDate} />
        </Info>
      </Box>
    </Box>
  )
}