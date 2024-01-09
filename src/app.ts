import { EventEmitter } from 'emitter'
import fs from 'fs'
import logger from './service/Logger'; 
import TelegramAccountService from './service/TelegramAccountService';
import { Channels, sequelize, TokenCalls } from './database/db';
import moment from 'moment';
import OrderService from './service/OrderService';
 
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(999);

let config = null;
 async function start() {
  await sequelize.sync({ force: false, alter: true });

  let buyserviceConfig=[];
  let sellserviceConfig=[];

  fs.readFile('./client.config.json', 'utf8', (error:any, data) => {
    if (error) {
     logger.debug(error);
      return;
    }
    
    const config = JSON.parse(data);
    let testmode=config.testmode;

    const tsA = new TelegramAccountService(config, eventEmitter); 
    
    eventEmitter.on('newListener', (event: string, listener: any) => {
      logger.debug(`Added Signal Repeater Server ${event.toUpperCase()} listener.`);
    });

    eventEmitter.on('buyOrderCompleted', async (tradeSignal: any) => {
 
      console.log(tradeSignal); 
      
      if(tradeSignal.tnx.status == 1){

        const OService :OrderService= sellserviceConfig[tradeSignal.tokenAddress] ;
        OService.setTokenBalance(tradeSignal.tokenBalance);


        const sellExpiry = config.sellExpiry *60*1000;
        const buyTime = Date.now();
        setInterval(()=>{
          try{
            OService.getCurrentProfits().then((currentProfits)=>{

              logger.info('Current profit = '+ currentProfits +' Take Profit Target '+ config.takeProfit);
               if((Date.now()-buyTime) > sellExpiry || Number(currentProfits) > Number(config.takeProfit) || Number(currentProfits)<= -Number(config.stopLoss))
              {

                if(Number(currentProfits)<= -Number(config.stopLoss))
                logger.info('SELLING TOKEN FOR MEETING STOPLOSS')
                if((Date.now()-buyTime) > sellExpiry || Number(currentProfits))
                logger.info('SELLING TOKEN FOR MEETING TIMELIMIT')
                if(Number(currentProfits) > Number(config.takeProfit))
                logger.info('SELLING TOKEN FOR MEETING TAKEPROFIT')

                OService.sellToken();

              }
            }) 
          }catch(error){
            logger.error('error')
          }
        

        },config.priceRefreshInterval*2000)
      }


    })
    eventEmitter.on('newSignal', async (tradeSignal: any) => {
      logger.debug('Recieved ');
      logger.debug(tradeSignal);

     const oldSignal = await  TokenCalls.findOne({where :{
        tokenAddress : tradeSignal.tokenAddress
      }})

      if(oldSignal && oldSignal.dataValues && oldSignal.dataValues.tokenAddress && !testmode) {
        logger.error('skipping Duplicates')
      }else {
        await TokenCalls.create(tradeSignal);
        try{
         
          const mcCheck = Number(config.minLiquidity)<=Number(tradeSignal.liquidity) ? 'OK':'Failed Liquidity Check of 15 SOLS';
          const tokenAge = Number(tradeSignal.tokenAge)  > Number(Date.now()-Number(config.maxTokenAgeGap) * 60 * 1000) ? 'OK': ' Failed Age Check of 10 Minutes';
          const fdvCheck = Number(tradeSignal.tokenMC) <=Number(config.maxTokenMC) ? 'OK': ' Failed Mcap check of 30k ';

  
          if(mcCheck=='OK' && tokenAge=='OK' && fdvCheck=='OK'){ 

            logger.debug(' Preparing Token Info for Buy/sell '+ tradeSignal.tokenAddress +' with 0.01 '+tradeSignal.baseAddress);

        const OService = new OrderService(tradeSignal,eventEmitter,config);
        const SService = new OrderService(tradeSignal,eventEmitter,config);

        await OService.preparePoolInfo();
        await SService.preparePoolInfo();


        buyserviceConfig[tradeSignal.tokenAddress] = OService;
        sellserviceConfig[tradeSignal.tokenAddress] = SService;
        

        try{
             logger.debug(' Buying Token '+ tradeSignal.tokenAddress +' with 0.01 '+tradeSignal.baseAddress);

              OService.buyNewToken();

            }catch(error){
              logger.error(error)
            }
          } else {

            logger.error('Liquidity Check '+mcCheck +' Actual ' +Number(tradeSignal.liquidity));
            logger.error('Age Check '+tokenAge +' Actual ' +new Date(tradeSignal.tokenAge));
            logger.error('Mcap check '+fdvCheck +' Actual ' +Number(tradeSignal.tokenMC));
          }
 

        }catch(error){
          logger.debug(error)
        }
      } 

    });


    eventEmitter.on('Disconnected', (message: string) => {
      logger.debug('Disconnected -- need to restart ' + message.toUpperCase());
      eventEmitter.removeAllListeners();
      tsA.disconnect(); 
      start();

    });

    

 

  })
}

start();



