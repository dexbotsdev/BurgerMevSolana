import { HttpProvider } from "@bloxroute/solana-trader-client-ts";
import { Wallet } from "@project-serum/anchor";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { connection } from "../config";
import logger from "./Logger";

class TradeService {

    provider: HttpProvider;
    c: any;
    w: Keypair; 

    constructor(_config: any, provider : HttpProvider, wallet: Keypair) {

        this.provider = provider;
        this.c = _config;
        this.w = wallet;
    }
 
    getBuyPrice = async (_tokenAddress: any, inAmount:number, slippage:number) => {

        const response = await this.provider.postRaydiumSwap({
            ownerAddress: this.w.publicKey.toBase58(),
            inToken: "SOL",
            outToken: _tokenAddress,
            inAmount: inAmount,
            slippage: slippage,
        }) 
         return response; 
      
    }

    getSellAmount = async (_tokenAddress: any, inAmount:number, slippage:number) => {

        const response = await this.provider.postRaydiumSwap({
            ownerAddress: this.w.publicKey.toBase58(),
            inToken: _tokenAddress,
            outToken: "SOL",
            inAmount: inAmount,
            slippage: slippage,
        }) 
         return response; 
      
    }

    buyToken = async (_tokenAddress: any,_buyInputAmount:number,_slippage:number) => {

      
        const response = await this.provider.postRaydiumSwap({
            ownerAddress: this.w.publicKey.toBase58(),
            outToken: _tokenAddress,
            inToken: "SOL",
            inAmount: _buyInputAmount,
            slippage: _slippage,
        }) 
     
        const buff = Buffer.from(response.transactions[0].content, "base64");
        const solanaTx = VersionedTransaction.deserialize(buff) 
        // Deserialize the transaction
        solanaTx.sign([this.w]);
        const sendm = await connection.sendTransaction(solanaTx,{
            skipPreflight:false,
            preflightCommitment:'recent',
        });
    
        // console.log(sendm);


        return sendm;

    }




    monitorToken(monitor: any) {
         
        const buyTime = monitor.buyTime;
        const runId = setInterval(async ()=>{
            try{ 
                const possibleAmnt = await this.getSellAmount(monitor.tokenAddress,monitor.tokenBalance,this.c.slippage);

                const currValue = Number(possibleAmnt.outAmountMin);

                const profit = (currValue - Number(this.c.buyInputAmount)) * 100/Number(this.c.buyInputAmount);

                logger.info(' Running Profits/Losses for Token '+ monitor.tokenSymbol+' is '+ Number(profit).toFixed(2) +' %');
                const sellExpiry = this.c.sellExpiry *60*1000;
                
                if((Date.now()-buyTime) > sellExpiry || Number(profit) > Number(this.c.takeProfit) || Number(profit)<= -Number(this.c.stopLoss))
                {
                    let tokenSell=false;
                    if(Number(profit)<= -Number(this.c.stopLoss))
                    {logger.info('SELLING TOKEN FOR MEETING STOPLOSS');
                tokenSell=true;}
                    if((Date.now()-buyTime) > sellExpiry && Number(profit)<= 0)
                    {logger.info('SELLING TOKEN FOR MEETING TIMELIMIT');
                    tokenSell=true;}
                    if( Number(profit) > Number(this.c.takeProfit))
                    {logger.info('SELLING TOKEN FOR MEETING TAKEPROFIT');
                    tokenSell=true;}

                    if(tokenSell){
                        const buff = Buffer.from(possibleAmnt.transactions[0].content, "base64");
                        const solanaTx = VersionedTransaction.deserialize(buff) 
                        // Deserialize the transaction
                        solanaTx.sign([this.w]);
                        const sendm = await connection.sendTransaction(solanaTx,{
                            skipPreflight:false,
                            preflightCommitment:'recent',
                        });

                        console.log(sendm);
                     clearInterval(runId); 

                    }
    
                }
                

              }catch(error){
                logger.error('error')
              }
            
    
            },this.c.priceRefreshInterval*1000);


 

    }
  
  
    
       

}


export default TradeService;