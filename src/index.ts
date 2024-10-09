import { EventEmitter } from 'emitter'
import fs from 'fs'
import logger from './service/Logger';
import { sequelize } from './database/db';
import { Keypair,LAMPORTS_PER_SOL,PublicKey } from '@solana/web3.js';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { privateKey } from './clients/jito';
import { GRPCSwapsListenerService } from './service/GRPCSwapListnerService';
import TradeExecutorService from './service/TradeExecutorService';
import { calculateProfitAndRoute } from './service/HelperUtils';
  
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
    const wallet = Keypair.fromSecretKey(bs58.decode(config.privateKey));
     
    const grpcSwaps = new GRPCSwapsListenerService(config.grpcUrl,config.grpcToken,undefined,eventEmitter);

   

    grpcSwaps.streamTargetTrader();
    eventEmitter.on('newListener', (event: string, listener: any) => {
      logger.debug(`Added  ${event.toUpperCase()} listener.`);
    });
    eventEmitter.on('newSwapDetected', async (tradeSignal: any) => {
      //logger.debug('newSwapDetected Received ',tradeSignal);

     // eventEmitter.removeAllListeners();
      const signal = JSON.parse(tradeSignal) 
       const insol = config.buyInputAmount*1e9
         let quoteResponseA = await (
          await fetch(config.jupApiUrl+`/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${signal.token}&amount=${insol}&slippageBps=50`)
        ).json();
       // console.log(quoteResponseA)
        
        let quoteResponseB = await (
          await fetch(config.jupApiUrl+`/quote?outputMint=So11111111111111111111111111111111111111112&inputMint=${signal.token}&amount=${quoteResponseA.otherAmountThreshold}&slippageBps=50`)
        ).json();
       //console.log(quoteResponseB)

         if(1<100*(quoteResponseB.otherAmountThreshold - quoteResponseA.inAmount)/quoteResponseA.inAmount){

          console.log(`Big WIN hahha ${signal.token} `)
          const profit = calculateProfitAndRoute(quoteResponseA,quoteResponseB) 

          if(profit>0){ 
            console.log(`Run Trade for Profit of ${profit} `);
            const tokenAddress = quoteResponseA.outputMint;


            const trader = new TradeExecutorService(config.jupApiUrl,config.rpcUrl);

            await trader.executeTrade(tokenAddress,config.privateKey,quoteResponseA.inAmount);

          }


        }



        
       
    }); 
    eventEmitter.on('tokenTraded', async (monitor: any) => {

      logger.sponsor(JSON.stringify(monitor,null,0));
      

    })


    eventEmitter.on('Disconnected', (message: string) => {
      logger.debug('Disconnected -- need to restart ' + message.toUpperCase());
      eventEmitter.removeAllListeners();
       start();

    });





  })
}

start();



