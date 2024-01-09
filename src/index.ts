import { EventEmitter } from 'emitter'
import fs from 'fs'
import logger from './service/Logger'; 
import TelegramAccountService from './service/TelegramAccountService';
import { Channels, sequelize, TokenCalls } from './database/db';
import moment from 'moment';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Liquidity, Market } from '@raydium-io/raydium-sdk';
import { Metaplex } from '@metaplex-foundation/js';
 
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(999);

let config = null;
 async function start() {
  await sequelize.sync({ force: false, alter: true });


  fs.readFile('./client.config.json', 'utf8', async (error, data) => {
    if (error) {
    //logger.debug(error);
      return;
    }
    const config = JSON.parse(data); 
    
    const connection = new Connection('https://api.mainnet-beta.solana.com', { commitment: "finalized" });
   
    const version :  4 | 5 = 4;
    const serumVersion = 10
    const marketVersion:3 = 3

    const poolId = new PublicKey("8eve16u96wjbcjB9NW623wyJRbKowaR8wnXncRjKgKen")
  
    const programId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
    const serumProgramId = new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX')
  
    const account = await connection.getAccountInfo(poolId)
    const { state: LiquidityStateLayout }  = Liquidity.getLayouts(version)
  
    //@ts-ignore
    const fields = LiquidityStateLayout.decode(account?.data);
    const { status, baseMint, quoteMint, lpMint, openOrders, targetOrders, baseVault, quoteVault, marketId, baseDecimal, quoteDecimal, poolOpenTime} = fields;
  
    let withdrawQueue, lpVault;
    if (Liquidity.isV4(fields)) {
      withdrawQueue = fields.withdrawQueue;
      lpVault = fields.lpVault;
    } else {
      withdrawQueue = PublicKey.default;
      lpVault = PublicKey.default;
    }
    
    // uninitialized
    // if (status.isZero()) {
    //   return ;
    // }
  
    const associatedPoolKeys = Liquidity.getAssociatedPoolKeys({
      version:version,
      marketVersion,
      marketId,
      baseMint: baseMint,
      quoteMint:quoteMint,
      baseDecimals: baseDecimal.toNumber(),
      quoteDecimals: quoteDecimal.toNumber(),
      programId,
      marketProgramId:serumProgramId,
    });
  
    const poolKeys = {
      id: poolId,
      baseMint,
      quoteMint,
      lpMint,
      version,
      programId,
  
      authority: associatedPoolKeys.authority,
      openOrders,
      targetOrders,
      baseVault,
      quoteVault,
      withdrawQueue,
      lpVault,
      marketVersion: serumVersion,
      marketProgramId: serumProgramId,
      marketId,
      marketAuthority: associatedPoolKeys.marketAuthority,
    };
  
    const marketInfo = await connection.getAccountInfo(marketId);
    const { state: MARKET_STATE_LAYOUT } = Market.getLayouts(marketVersion);
    //@ts-ignore
    const market = MARKET_STATE_LAYOUT.decode(marketInfo.data);

    console.log(new Date(1000*Number(poolOpenTime.toString())).toString());

    const tokenMint = market.baseMint;

    const metaplex = Metaplex.make(connection);
   
     
    const token = await metaplex.nfts().findByMint({ mintAddress: tokenMint });
    let tokenName = token.name;
    let tokenSymbol = token.symbol;
    let sellerFeeBasisPoints = token.mint.supply.basisPoints.toString();
    let tokenDecimals = token.mint.decimals;
 
     console.log(tokenName);
    console.log(tokenSymbol);
    console.log(sellerFeeBasisPoints.toString());
    console.log(tokenDecimals     ); 
 
  })
}

start();



