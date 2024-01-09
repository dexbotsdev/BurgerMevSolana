import logger from "service/Logger";
import { getPairData } from "./TokenProcessor";

export const processMessage = async(message: { message: any })=>{

    if(message && message.message){
            const text = message.message; 
            const addressInmessage = parseAddress(text); 


            console.log(addressInmessage);
            if(text.indexOf('Marketcap')>0){

                const data=  parseNewPool(text);

                return {
                    result: data,
                    type:1
                }
            }
            if(addressInmessage){

                const data = await getPairData(addressInmessage.tokenAddress);
 
                if(data.tokenName && data.tokenAddress && data.currPrice && data.tokenSymbol && data.tokenMC){ 
                    return {
                        result: data,
                        type:2
                    }
                }
            } else return null;

    }
    

}
export const parseAddress = (text: string) => {

     let result: { tokenName: string; tokenAddress: string; poolAddress: string; };
    // Use the regular expression to extract information
    const tokenNameRegex = /🔥 New Liquidity Burn for (.+?)! 🔥/;
    const addressRegex = /🏠 Address: (.+)/;
    const poolRegex = /🆔 Pool: (.+)/;
    
    // Use regex patterns to extract information
    const tokenNameMatch = text.match(tokenNameRegex);
    const addressMatch = text.match(addressRegex);
    const poolMatch = text.match(poolRegex);
    
    if (tokenNameMatch && addressMatch && poolMatch) {
      // Initialize an object to store the information
        // Initialize an object to store the information
        result = {
            tokenName: tokenNameMatch[1],
            tokenAddress: addressMatch[1],
            poolAddress: poolMatch[1],
          };
        // Convert the result object to JSON and log it
        const resultJSON = JSON.stringify(result, null, 2);
     } else {
        console.log('No match found.');
    }


    return result;
}

function parseNewPool(text: any) {
    const solanaAddressRegex = /[A-Z0-9a-z]{40,}/gm;

    // Extract Solana addresses from the text
    const matches = text.match(solanaAddressRegex);

    // Extract the Solana address if found
    const solanaAddress = matches ? matches[0] : null;
    console.log(text);
    
    return {tokenAddress: solanaAddress};
}
