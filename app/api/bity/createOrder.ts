import { NowRequest, NowResponse } from '@now/node'

import Bity from '../../src/lib/wrappers/bity';
import config from '../../src/config';
import {TradeRequest, BankInfo, ETHInfo} from "../../src/lib/trading/types";

const bityInstance = new Bity();

export default async (req: NowRequest, res: NowResponse) => {
  if(!req.body) {
    res.status(400).send('no body');
    return;
  }

  const tradeRequest: TradeRequest = req.body.tradeRequest as TradeRequest;
  const bankInfo: BankInfo = req.body.bankInfo as BankInfo;
  const ethInfo: ETHInfo = req.body.ethInfo as ETHInfo;

  if(!tradeRequest || !bankInfo || !ethInfo) {
    return res.status(400).send('wrong body');
  }

  // TODO check auth
  await bityInstance.initializeAuth(config.private.bityClientId, config.private.bityClientSecret);

  try {
    const bityTrade = await bityInstance.createOrder(tradeRequest, bankInfo, ethInfo);
    return res.json(bityTrade)
  } catch(error) {
    if(error._orderError) {
      return res.status(400).json({
        message: error.message,
        _orderError: error._orderError,
        errors: error.errors
      });
    } else {
      return res.status(500).send('Unexpected server error');
    }
  }

}
