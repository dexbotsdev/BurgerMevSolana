import { HttpProvider } from "@bloxroute/solana-trader-client-ts";
import { Keypair } from "@solana/web3.js";

class PricingService {
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
        console.info(response)  
        return response; 
      
    }

  
    getSellResult = async (_tokenAddress: any,_tokenBalance:any) => {

      
    }

}


export default PricingService;