import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { DEFAULT_TOKEN, connection, makeTxVersion } from '../config';
import WebSocket from 'ws';
import { EventEmitter } from 'emitter'
import { HttpProvider } from "@bloxroute/solana-trader-client-ts";
import { Liquidity, LiquidityPoolKeys, Percent, TOKEN_PROGRAM_ID, Token, TokenAmount, WSOL, jsonInfo2PoolKeys } from '@raydium-io/raydium-sdk';
import { buildAndSendTx, getWalletTokenAccount, getWalletTokenBalance } from '../utils/util';
import { AxiosRequestConfig } from 'axios';
import { formatAmmKeysById } from '../utils/formatAmmKeysById';
import logger from './Logger';


class OrderService {

    em: EventEmitter;
    socket: WebSocket;
    connection: Connection;
    c: any;
    wallet: Keypair;
    t: any;
    isTokenBought: boolean;
    provider: HttpProvider;
    walletTokenAccounts: any;
    poolId: PublicKey;
    targetPoolInfo: any;
    poolKeys: any;
    fields: { status: any; baseMint: any; quoteMint: any; lpMint: any; openOrders: any; targetOrders: any; baseVault: any; quoteVault: any; marketId: any; baseDecimal: any; quoteDecimal: any; };
    tokenBalance: number = 0;
    poolInfo: any;

    constructor(tradeSignal: any, em: EventEmitter, config: any) {

        const httpTimeout = 30_000
        this.em = em;
        const requestConfig: AxiosRequestConfig = {
            timeout: httpTimeout,
        }
        this.connection = connection;
        this.t = tradeSignal;
        this.c = config;
        this.wallet = Keypair.fromSecretKey(Uint8Array.from(config.privateKey));
        this.isTokenBought = false;
    }

    setTokenBalance = (balance: number) => {
        this.tokenBalance = balance;
    }
    preparePoolInfo = async () => {
        const version: 4 | 5 = 4;

        this.walletTokenAccounts = await getWalletTokenAccount(connection, this.wallet.publicKey);
        this.poolId = new PublicKey(this.t.pairAddress);
        this.targetPoolInfo = await formatAmmKeysById(this.t.pairAddress)
        this.poolKeys = jsonInfo2PoolKeys(this.targetPoolInfo) as LiquidityPoolKeys;
        const account = await connection.getAccountInfo(this.poolId)
        const { state: LiquidityStateLayout } = Liquidity.getLayouts(version)
        this.fields = LiquidityStateLayout.decode(account?.data);
        this.poolInfo = await Liquidity.fetchInfo({ connection, poolKeys: this.poolKeys })

    }


    buyNewToken = async () => {


        try {
            const tokenbalance = await getWalletTokenBalance(connection, this.wallet.publicKey, new PublicKey(this.t.tokenAddress));
            logger.debug('Current Token ' + this.t.tokenSymbol + ' Balance is ' + tokenbalance);

            logger.debug('Buy Token ' + this.t.tokenSymbol);

            const inputToken = DEFAULT_TOKEN.SOL // USDC
            const slippage = new Percent(0, 100)
            logger.debug('Swapping from intoken to out token ');
            const { status, baseMint, quoteMint, lpMint, openOrders, targetOrders, baseVault, quoteVault, marketId, baseDecimal, quoteDecimal, } = this.fields;


            let outputToken = new Token(TOKEN_PROGRAM_ID, baseMint, baseDecimal.toNumber(), this.t.tokenName, this.t.tokenSymbol);
            if (baseMint.toString() == WSOL.mint.toString())
                outputToken = new Token(TOKEN_PROGRAM_ID, quoteMint, quoteDecimal.toNumber(), this.t.tokenName, this.t.tokenSymbol);



            const targetPool = this.t.pairAddress;
            const inputTokenAmount = new TokenAmount(inputToken, this.c.buyInputAmount * 10 ** baseDecimal.toNumber());

            this.poolInfo = await Liquidity.fetchInfo({ connection, poolKeys: this.poolKeys })
            const { amountOut,
                minAmountOut,
                currentPrice,
                executionPrice,
                priceImpact,
                fee } = Liquidity.computeAmountOut({
                    poolKeys: this.poolKeys,
                    poolInfo: this.poolInfo,
                    amountIn: inputTokenAmount,
                    currencyOut: outputToken,
                    slippage: slippage,
                })
            if (amountOut.isZero()) return { txids: { status: 0 } };


            const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
                connection,
                poolKeys: this.poolKeys,
                userKeys: {
                    tokenAccounts: this.walletTokenAccounts,
                    owner: this.wallet.publicKey,
                },
                amountIn: inputTokenAmount,
                amountOut: minAmountOut,
                fixedSide: 'in',
                makeTxVersion,
            })


            logger.debug('Swapping Liquidity  ')

            logger.debug('Swapping from   inputAmount ' + inputTokenAmount.toFixed())
            logger.debug('amountOut:' + amountOut.toSignificant() + '  minAmountOut: ' + minAmountOut.toSignificant())
            logger.debug('currentPrice:' + currentPrice.invert().toFixed() + '  executionPrice: ' + executionPrice?.toSignificant())
            logger.debug('priceImpact:' + priceImpact.toSignificant() + '  fee: ' + fee.toSignificant())
            const tnx = await buildAndSendTx(innerTransactions, this.wallet);
            logger.debug(parseInt('' + Number(this.c.buyInputAmount) * 10 ** baseDecimal.toNumber() / Number(currentPrice.invert().toFixed())).toString())

            const orderCompleted = {
                ...this.t,
                tokenBalance: parseInt('' + Number(this.c.buyInputAmount) / Number(currentPrice.invert().toFixed())),
                tnx
            }


            this.em.emit('buyOrderCompleted', orderCompleted);
        } catch (error) {
            logger.error(error.toString())
        }




    }

    sellToken = async () => {

        try{
            const tokenbalance = await getWalletTokenBalance(connection, this.wallet.publicKey, new PublicKey(this.t.tokenAddress));
            logger.debug('Current Token ' + this.t.tokenSymbol + ' Balance is ' + tokenbalance);
    
            logger.debug('Sell Token ' + this.t.tokenSymbol);
    
            const slippage = new Percent(0, 100)
            logger.debug('Swapping from intoken to out token ');
    
            const { status, baseMint, quoteMint, lpMint, openOrders, targetOrders, baseVault, quoteVault, marketId, baseDecimal, quoteDecimal, } = this.fields;
    
            let inputToken = new Token(TOKEN_PROGRAM_ID, baseMint, baseDecimal.toNumber(), this.t.tokenName, this.t.tokenSymbol);
            let inputTokenAmount = new TokenAmount(inputToken, parseInt('' + Number(tokenbalance) * 10 ** baseDecimal));
    
            if (baseMint.toString() == WSOL.mint.toString()) {
                inputToken = new Token(TOKEN_PROGRAM_ID, quoteMint, quoteDecimal.toNumber(), this.t.tokenName, this.t.tokenSymbol);
                inputTokenAmount = new TokenAmount(inputToken, parseInt('' + Number(tokenbalance) * 10 ** quoteDecimal));
            }
            const outputToken = DEFAULT_TOKEN.SOL // USDC
    
            const targetPool = this.t.pairAddress;
            this.poolInfo = await Liquidity.fetchInfo({ connection, poolKeys: this.poolKeys })
    
            const { amountOut,
                minAmountOut,
                currentPrice,
                executionPrice,
                priceImpact,
                fee } = Liquidity.computeAmountOut({
                    poolKeys: this.poolKeys,
                    poolInfo: this.poolInfo,
                    amountIn: inputTokenAmount,
                    currencyOut: outputToken,
                    slippage: slippage,
                })
            if (amountOut.isZero()) return { txids: { status: 0 } };
    
    
            const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
                connection,
                poolKeys: this.poolKeys,
                userKeys: {
                    tokenAccounts: this.walletTokenAccounts,
                    owner: this.wallet.publicKey,
                },
                amountIn: inputTokenAmount,
                amountOut: minAmountOut,
                fixedSide: 'in',
                makeTxVersion,
            })
    
    
            logger.debug('Swapping Liquidity  ')
    
            logger.debug('Swapping from   inputAmount ' + inputTokenAmount.toFixed())
            logger.debug('amountOut:' + amountOut.toSignificant() + '  minAmountOut: ' + minAmountOut.toSignificant())
            logger.debug('currentPrice:' + currentPrice.toFixed() + '  executionPrice: ' + executionPrice?.toSignificant())
            logger.debug('priceImpact:' + priceImpact.toSignificant() + '  fee: ' + fee.toSignificant())
            const tnx = await buildAndSendTx(innerTransactions, this.wallet);
            logger.debug(tnx.toString())
    
            const orderCompleted = {
                ...this.t,
                tnx
            }
    
            this.em.emit('sellOrderCompleted', orderCompleted);
        }catch(error){
            logger.error(error.toString());
        }
      


    }


    getCurrentProfits = async () => {
       
        try{
            const tokenbalance = this.tokenBalance; //await getWalletTokenBalance(connection, this.wallet.publicKey, new PublicKey(this.t.tokenAddress));
            logger.debug('Current Token ' + this.t.tokenSymbol + ' Balance is ' + tokenbalance); 
     
            const slippage = new Percent(0, 100)
            const version: 4 | 5 = 4;
    
            const { status, baseMint, quoteMint, lpMint, openOrders, targetOrders, baseVault, quoteVault, marketId, baseDecimal, quoteDecimal, } = this.fields;
    
    
            let inputToken = new Token(TOKEN_PROGRAM_ID, baseMint, baseDecimal.toNumber(), this.t.tokenName, this.t.tokenSymbol);
            let inputTokenAmount = new TokenAmount(inputToken, parseInt('' + tokenbalance * 10 ** baseDecimal));
    
            if (baseMint.toString() == WSOL.mint.toString()) {
                inputToken = new Token(TOKEN_PROGRAM_ID, quoteMint, quoteDecimal.toNumber(), this.t.tokenName, this.t.tokenSymbol);
                inputTokenAmount = new TokenAmount(inputToken, parseInt('' + tokenbalance * 10 ** quoteDecimal));
            }
            const outputToken = DEFAULT_TOKEN.SOL // USDC
    
    
            this.poolInfo = await Liquidity.fetchInfo({ connection, poolKeys: this.poolKeys })
            const { amountOut,
                minAmountOut,
                currentPrice,
                executionPrice,
                priceImpact,
                fee } = Liquidity.computeAmountOut({
                    poolKeys: this.poolKeys,
                    poolInfo: this.poolInfo,
                    amountIn: inputTokenAmount,
                    currencyOut: outputToken,
                    slippage: slippage,
                })
            logger.debug('For   inputAmount ' + inputTokenAmount.toFixed())
            logger.debug('amountOut:' + amountOut.toSignificant() + '  minAmountOut: ' + minAmountOut.toSignificant())
            logger.debug('currentPrice:' + currentPrice.toFixed() + '  executionPrice: ' + executionPrice?.toSignificant())
            logger.debug('priceImpact:' + priceImpact.toSignificant() + '  fee: ' + fee.toSignificant())
    
            const buyPrice = Number(this.c.buyInputAmount) / Number(tokenbalance)
    
            const ifSold = Number(currentPrice.toFixed()) * Number(tokenbalance);
    
            const profit = (Number(currentPrice.toFixed()) - buyPrice) * 100 / buyPrice;
    
            logger.debug('For   buyprice ' + buyPrice.toFixed(12))
    
            logger.info('Profit calculated ' + this.t.tokenSymbol + ' at Price ' + currentPrice.toFixed() + ' is ' + profit + ' %')
    
    
            return profit;
        }catch(error){
            logger.error(error.toString());
        }
       


    }


}


export default OrderService;