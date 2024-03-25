import { EventEmitter } from 'emitter'
import fs from 'fs'
import logger from './service/Logger';
import TelegramAccountService from './service/TelegramAccountService';
import { sequelize, TokenCalls, TradeLogs } from './database/db';
import TokenCheckService from './api/TokenCheckService';
import { Keypair,PublicKey } from '@solana/web3.js';
import { HttpProvider } from '@bloxroute/solana-trader-client-ts';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { connection, MAINNET_API_HTTP, MAINNET_AUTH_HEADER, requestConfig } from './config';
import PricingService from './service/PricingService';
import TradeService from './service/TradeService';
import { getWalletTokenBalance } from './utils/util';
 
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(999);

 async function start() {
  await sequelize.sync({ force: false, alter: true }); 
  fs.readFile('./client.config.json', 'utf8', (error: any, data) => {
    if (error) {
      logger.debug(error);
      return;
    } 
    const config = JSON.parse(data);
    let testmode = config.testMode; 
    const wallet = Keypair.fromSecretKey(Uint8Array.from(config.privateKey));
    const provider = new HttpProvider(
      MAINNET_AUTH_HEADER,
      bs58.encode(config.privateKey),
      MAINNET_API_HTTP,
      requestConfig
    ) 

      const trader = new TradeService(config,provider,wallet);


    eventEmitter.on('newListener', (event: string, listener: any) => {
      logger.debug(`Added  ${event.toUpperCase()} listener.`);
    });

    eventEmitter.on('buyOrderCompleted', async (monitor: any) => {

      logger.sponsor(JSON.stringify(monitor,null,0));
      const tokenMint = new PublicKey(monitor.tokenAddress);
      let tokenBalance = await getWalletTokenBalance(connection, wallet.publicKey, tokenMint);

      if(config.testMode==true){
        const resp = await trader.getBuyPrice(monitor.tokenAddress, config.buyInputAmount,config.slippage);
        tokenBalance = resp.outAmount.toFixed();
      }

      logger.info('Current Token Balance is '+ tokenBalance);
      const avgBuyPrice = Number(Number(config.buyInputAmount)/Number(tokenBalance)).toFixed(12);

      monitor.avgBuyPrice = avgBuyPrice;
      monitor.tokenBalance = tokenBalance;

      const tokenTrades = new TradeLogs(monitor);
      await tokenTrades.save();
    
       logger.debug(' Keep Polling for Prices and Sell off ')

       trader.monitorToken(monitor)


    })
    eventEmitter.on('newSignal', async (tradeSignal: any) => {
      logger.debug('Recieved ');

      const oldSignal = await TokenCalls.findOne({
        where: {
          tokenAddress: tradeSignal.tokenAddress
        }
      })

      if (oldSignal && oldSignal.dataValues && oldSignal.dataValues.tokenAddress && !testmode) {
        logger.error('skipping Duplicates')
      } else {

      
        try {

          const pot = new Date(Number(tradeSignal.poolOpenTime)*1000);
          const nowd = Date.now();

          if(nowd < pot.getTime())
          {
            logger.debug('Pool is Not Yet Opened for Trading ');
            return;

          }

          const mcCheck = Number(config.minLiquidity) <= Number(tradeSignal.liquiditySOL) ? 'OK' : 'Failed Liquidity Check of '+ Number(config.minLiquidity)+' SOLS';
           const fdvCheck = Number(tradeSignal.liquidityUSDC) <= Number(config.maxTokenMC) ? 'OK' : ' Failed Mcap check of '+ Number(config.liquidityUSDC)+' ';
          const mintableCheck = !tradeSignal.mintable ? 'OK' : ' Failed Mintable Check : Token is Mintable ';
          const freeZableCheck = !tradeSignal.freezeaBle ? 'OK' : ' Failed Freezable Check : Token is Freezable ';

 
          if (mcCheck == 'OK' && fdvCheck == 'OK' && mintableCheck =='OK' && freeZableCheck=='OK') { 
            logger.debug(' Preparing Token Info for Buy/sell ' + tradeSignal.tokenSymbol + ' with 0.01 ' + tradeSignal.quoteSymbol);
         
            try {
              logger.debug(' Buying Token ' + tradeSignal.tokenSymbol + ' with 0.01 ' + tradeSignal.quoteSymbol);

              trader.buyToken(tradeSignal.tokenAddress, config.buyInputAmount,config.slippage).then(async (result)=>{

                logger.debug('Token Bought -- Checking Transaction - Create Websocket and Listen.')

                connection.onSignature(result, (sigresult) => {
                  logger.debug('Listening to Data ')

                  if(sigresult.err ==null ){

                    logger.debug('Emitting Token Data for Sell Monitoring ')
                    const monitor = {
                      tokenAddress : tradeSignal.tokenAddress,
                      tnxSignature : result
                    }
    
                    let tokenTrade = {
                      tokenSymbol:tradeSignal.tokenSymbol,
                      tokenAddress: tradeSignal.tokenAddress,
                      buyTime: Date.now(), 
                      buyAmount: config.buyInputAmount,
                      sellTime:null,
                      sellAmount:0,
                      sold:false,
                      avgBuyPrice:0
                    }
                    
                    
                    eventEmitter.emit('buyOrderCompleted', tokenTrade);
                  }
                }) 
              }).catch((Error)=>{
                  
                console.log('Buy Failed '+ Error);
              })

            } catch (error) {
              logger.error(error)
            }
          } else {

             logger.error('Liquidity Check :- ' + mcCheck + ' Actual ' + Number(tradeSignal.liquiditySOL));
             logger.error('Mcap check :-  ' + fdvCheck + ' Actual ' + Number(tradeSignal.liquidityUSDC));
             logger.error('Mintable check :-  ' + mintableCheck + ' Actual ' + tradeSignal.mintable);
             logger.error('Freezable check  :- ' + freeZableCheck + ' Actual ' + tradeSignal.freezeaBle);
          }


        } catch (error) {
          logger.debug(error)
        }
      }

    });


    eventEmitter.on('Disconnected', (message: string) => {
      logger.debug('Disconnected -- need to restart ' + message.toUpperCase());
      eventEmitter.removeAllListeners();
       start();

    });





  })
}

start();



