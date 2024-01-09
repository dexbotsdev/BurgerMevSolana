import { Channels } from "../database/db";
import moment from "moment";

let formatter = Intl.NumberFormat('en', { notation: 'compact' });

export const NewMessageFormat =(commandDetail: any,totalCallsCount:number)=>{ 
    
return `
$${commandDetail.tokenSymbol} <b>New Call :</b> <b> <a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">${commandDetail.callerTG}</a></b>

🟢 Token : $${commandDetail.tokenSymbol} || ${commandDetail.tokenName}

🚀 MCap:  $${formatter.format(commandDetail.tokenMC)}

<code>${commandDetail.tokenAddress}</code>


📈 <a href="${commandDetail.url}">Chart</a>     
🔫 <a href="https://t.me/MaestroSniperBot?start=${commandDetail.tokenAddress}">Maestro</a>      🌟<a href="https://t.me/MaestroProBot?start=${commandDetail.tokenAddress}">MaestroPro</a> 

Call Alerts from <b>@marketingalerts</b>
`;
}


const listoftgcalls=async (commandDetail:any,logs:any)=>{
 
    let out='';
    let cnt=1;
    if(logs.length === 0 && !commandDetail.isAlpha){
 
        out =out+`<b>${cnt++}. <a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">${commandDetail.callerTG}</a></b>
🟦 Market Cap : <b>${formatter.format(commandDetail.tokenMC)} || ROI: 0 %</b> `;

    }
    else 
   
    await logs.forEach((item: any)=>{
       
        if(item.isAlpha){
            out =out+`<b>${cnt++}. ALPHACALL</b>
🟦 Market Cap : <b>${formatter.format(item.mcap)} || ROI: ${item.athROI}%</b> 
`;
        } else 
        out =out+`<b>${cnt++}. <a href="https://t.me/${item.channelName}/${item.callerPostId}">${item.callerTG}</a></b>
🟦 Market Cap : <b>${formatter.format(item.mcap)} || ROI: ${item.athROI}%</b> 

`;
 
 
    })
 
    return out;

    
}


export const AllCallsMessage =async (commandDetail: any, tokenLogs:any,alphaCallsCount: number)=>{ 
    
    let cnt = tokenLogs.calls.length >0 ? tokenLogs.calls.length:1;
    return  `
🚀 <b>$${commandDetail.tokenSymbol} TOTAL MARKETING : ${cnt} </b>

💳 Alpha Calls : ${alphaCallsCount} ${getCallCountBalls(alphaCallsCount)}            

TOTAL CALLS || MCAP

${await listoftgcalls(commandDetail,tokenLogs.calls)}   
 
<b>🚀 Token :</b>  $${commandDetail.tokenName} (${commandDetail.tokenSymbol})
<code>${commandDetail.tokenAddress}</code>

📈 <a href="${commandDetail.url}">Chart</a>     
🔫 <a href="https://t.me/MaestroSniperBot?start=${commandDetail.tokenAddress}">Maestro</a>      🌟<a href="https://t.me/MaestroProBot?start=${commandDetail.tokenAddress}">MaestroPro</a> 

Call Alerts from <b>@marketingalerts</b>
`;
} 


export const UpdateFromNewCall =(commandDetail: any,totalCallsCount:number)=>{  
    
    return `
    $${commandDetail.tokenSymbol} <b>New Call :</b>  <b> <a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">${commandDetail.callerTG}</a></b>

🟢 Token : $${commandDetail.tokenSymbol} || ${commandDetail.tokenName}

📊 Real-Time MCap:  $${formatter.format(commandDetail.tokenMC)}
 
⚠ CA : <code>${commandDetail.tokenAddress}</code>


📈 <a href="${commandDetail.url}">Chart</a>     
🔫 <a href="https://t.me/MaestroSniperBot?start=${commandDetail.tokenAddress}">Maestro</a>      🌟<a href="https://t.me/MaestroProBot?start=${commandDetail.tokenAddress}">MaestroPro</a> 

Call Alerts from <b>@marketingalerts</b>
`;
    }
    
    
 


export const UpdateFromAddonCall =(commandDetail: any, totalCallsCount:number)=>{  
    
    return `
$${commandDetail.tokenSymbol} <b>New Call :</b>  <b> <a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">${commandDetail.callerTG}</a></b>


🟢 Token : $${commandDetail.tokenSymbol} || ${commandDetail.tokenName}

📊 Real-Time MCap:  $${formatter.format(commandDetail.tokenMC)}

⚠ CA : ${commandDetail.tokenAddress}

📈 <a href="${commandDetail.url}">Chart</a> 
    
⭐ <a href="https://t.me/MaestroSniperBot?start=${commandDetail.tokenAddress}">Maestro</a>      🌟<a href="https://t.me/MaestroProBot?start=${commandDetail.tokenAddress}">MaestroPro</a> 
 
Call Alerts from <b>@marketingalerts</b>
    `;
    }
     
    const  getAlphaCount= (calls : any) => {


      //console.log("********************* IN Get Alpha Count Method ")
         let disp = 0;
        for (var i = 0; i < calls.length; i++) {
 
            if(Number(calls[i].isAlpha) === 1 ){
            disp = disp + 1
 
        }
    }


        return disp;
    }

  const  getCallCountBalls = (alphaCallsCount : any) => { 
        let disp = '';
        for (var i = 0; i < alphaCallsCount; i++) {
 
            disp = disp + '🟢'
            if ((i+1) % 3 === 0) disp = disp + '||'; 
        }
        return disp;
    }

    const getCallerLines=(calls: any)=>{

        let outcome = '     ';

        for (var i = 0; i < calls.length; i++) {

            outcome += `    <b><u>${i + 1}. ${calls[i].callerTG}</u></b>
    
            🟦 <b> Market Cap : $${formatter.format(calls[i].mcap)} || ROI: ${calls[i].athROI}%</b>
    
    ` 
        }

        return outcome;
    }