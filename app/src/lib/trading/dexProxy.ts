import { ethers, providers, BigNumber } from 'ethers';

import { Token} from './currencyTypes';
import {amountToDecimal, amountToInt, BN} from '../numbers';
import {DexTrade, TradeExact, TradeRequest, TradeType} from './types';
import { defaultProvider } from '../web3Providers';
import ERC20_ABI from '../abis/ERC20.json';
import Paraswap from '../wrappers/paraswap';

function calculatedGasMargin(gas) {
  const offset = gas.mul(1000).div(10000);
  return gas.add(offset);
}

interface IDexProxy {
  isTokenExchangeable(tokenAddress: string): Promise<Token | null>;
  getRate(tradeRequest: TradeRequest): Promise<DexTrade>;
  getSpender(dexTrade: DexTrade): Promise<string>;
  getAllowance(tokenAddress: string, senderAddress: string, spenderAddress: string): Promise<string>;
  approve(tokenAddress: string, senderAddress: string, spenderAddress: string, intAmount: string, provider: providers.Web3Provider): Promise<string>;
  checkAndApproveAllowance(dexTrade: DexTrade, provider: providers.Web3Provider): Promise<string | null>;
  executeTrade(dexTrade: DexTrade, provider: providers.Web3Provider): Promise<string>;
}

const DexProxy: IDexProxy = {
  // TODO when add new token
  async isTokenExchangeable(tokenAddress: string) {
    const tokens = await Paraswap.getTokenList();
    const foundToken = tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
    return foundToken || null;
  },

  async getRate(tradeRequest: TradeRequest): Promise<DexTrade> {
    const swapSide = tradeRequest.tradeExact === TradeExact.INPUT ? 'SELL' : 'BUY';
    const amountCurrency = tradeRequest.tradeExact === TradeExact.INPUT ? tradeRequest.inputCurrency : tradeRequest.outputCurrency;
    const intAmount = amountToInt(tradeRequest.amount, amountCurrency.decimals);

    const dexMetadata = await Paraswap.getRate(tradeRequest.inputCurrency.symbol, tradeRequest.outputCurrency.symbol, intAmount, swapSide);

    const inputAmount = amountToDecimal(dexMetadata.priceRoute.srcAmount, tradeRequest.inputCurrency.decimals);
    const outputAmount = amountToDecimal(dexMetadata.priceRoute.destAmount, tradeRequest.outputCurrency.decimals);

    return {
      tradeRequest,
      inputAmount,
      outputAmount,
      tradeType: TradeType.DEX,
      dexMetadata,
    };
  },

  async getSpender(_dexTrade: DexTrade): Promise<string> {
    return Paraswap.getSpender();
  },

  async getAllowance(tokenAddress: string, senderAddress: string, spenderAddress: string): Promise<string>
  {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, defaultProvider);
    const allowance = await tokenContract.allowance(senderAddress, spenderAddress);
    return allowance.toString();
  },

  async approve(tokenAddress: string, senderAddress: string, spenderAddress: string, intAmount: string, provider: providers.Web3Provider): Promise<string> {
    const signer = provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

    const estimatedGas = await tokenContract.estimateGas.approve(spenderAddress, intAmount);
    const gasLimit = calculatedGasMargin(estimatedGas);
    const tx = await tokenContract.approve(
      spenderAddress,
      BigNumber.from(intAmount),
      {
        gasLimit: BigNumber.from(gasLimit),
      }
    );
    return tx.hash;
  },

  async checkAndApproveAllowance(dexTrade: DexTrade, provider: providers.Web3Provider): Promise<string | null> {
    const signer = provider.getSigner();

    const tokenAddress = (dexTrade.tradeRequest.inputCurrency as Token).address;
    const senderAddress = await signer.getAddress();
    const spenderAddress = await DexProxy.getSpender(dexTrade);
    const intAmount = amountToInt(dexTrade.inputAmount, dexTrade.tradeRequest.inputCurrency.decimals);

    const allowance = await DexProxy.getAllowance(tokenAddress, senderAddress, spenderAddress);
    if(new BN(intAmount).gt(allowance)) {
      const txHash = await DexProxy.approve(tokenAddress, senderAddress, spenderAddress, intAmount, provider);
      return txHash;
    }

    return null;
  },


  async executeTrade(dexTrade: DexTrade, provider: providers.Web3Provider): Promise<string> {
    const signer = provider.getSigner();
    const senderAddress = await signer.getAddress();
    const transactionRequest = await Paraswap.buildTx(dexTrade, senderAddress);
    const tx = await signer.sendTransaction(transactionRequest);
    return tx.hash as string;
  },
};

export default DexProxy;
