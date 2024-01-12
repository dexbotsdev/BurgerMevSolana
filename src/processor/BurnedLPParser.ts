import logger from "service/Logger";
import { getPairData } from "./TokenProcessor";
import TokenCheckService from "../api/TokenCheckService";

export const processMessage = async(message: { message: any })=>{

    if(message && message.message){
            const text = message.message; 
            const addressInmessage = parseAddress(text); 
  
            if(addressInmessage){

                 const checkerService = new TokenCheckService(addressInmessage.tokenAddress);
                 const results = await checkerService.analyze();

           
                 return results;
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


 
