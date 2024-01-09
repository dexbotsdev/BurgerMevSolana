import {
  buildSimpleTransaction,
  findProgramAddress,
  InnerSimpleV0Transaction,
  SPL_ACCOUNT_LAYOUT,
  TOKEN_PROGRAM_ID,
  TokenAccount,
} from '@raydium-io/raydium-sdk';
import {
  Connection,
  Keypair,
  PublicKey,
  SendOptions,
  Signer,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { addLookupTableInfo, connection, makeTxVersion } from '../config';
import logger from '../service/Logger';
 
 

export async function sendTx(
  connection: Connection,
  payer: Keypair | Signer,
  txs: (VersionedTransaction | Transaction)[],
  options?: SendOptions
): Promise<string[]> {
  const txids: string[] = [];

  logger.debug('Sending Tnx inside sendTnx');
  try{
    for (const iTx of txs) {
      if (iTx instanceof VersionedTransaction) {
        iTx.sign([payer]);
        txids.push(await connection.sendTransaction(iTx, {maxRetries:5}));
      } else {
        txids.push(await connection.sendTransaction(iTx, [payer], {maxRetries:5}));
      }
    }
  }catch(err){
    console.log(err);
    return txids;
  } 
  logger.debug('Returning Tnx  after sendTnx');

  return txids;
}

export async function getWalletTokenBalance(connection: Connection, wallet: PublicKey,tokenMint: PublicKey) {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });
  

  const accountInfos=  walletTokenAccount.value.filter((i)=>SPL_ACCOUNT_LAYOUT.decode(i.account.data).mint.toBase58().toLowerCase() == tokenMint.toBase58().toLowerCase());

  if(accountInfos.length>0){

    console.log(' Token balance Is : '+ SPL_ACCOUNT_LAYOUT.decode(accountInfos[0].account.data).amount.toString());

    return SPL_ACCOUNT_LAYOUT.decode(accountInfos[0].account.data).amount.toString();
  }
   else return '0';
}


export async function getWalletTokenAccount(connection: Connection, wallet: PublicKey): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });
  

  // walletTokenAccount.value.map((i) => (console.log({
  //   pubkey: i.pubkey.toString(), 
  //   accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data).amount.toString(),
  // })));

  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}

export async function buildAndSendTx(innerSimpleV0Transaction: InnerSimpleV0Transaction[], wallet: Keypair,  options?: SendOptions) {
 
 
  logger.debug('Building Transaction  ' );


  const willSendTx = await buildSimpleTransaction({
    connection,
    makeTxVersion,
    payer: wallet.publicKey,
    innerTransactions: innerSimpleV0Transaction,
    addLookupTableInfo: addLookupTableInfo,
  })
  let status=1;
  let tnx=null;

  try{
    logger.debug('Sending Transaction  ' );

    const transactionSignature = await sendTx(connection, wallet, willSendTx, options);

    logger.debug('Transaction Signatures '+ transactionSignature[0]);



    if(transactionSignature.length>0){
      let retries=5;
      let inTrade=false;
      while(retries>0 && !inTrade){
    
        console.log('Retrying until find the Signature Status of Transaction '+ retries--);
        try {
          // Get transaction details
          const transactionInfo = await connection.getParsedTransaction(transactionSignature[0], {
            commitment: 'confirmed', // 'processed' or 'confirmed'
          });
      
          let a=0;
          while(a>2000){
            a++;
          }          
          // Check if the transaction is successful
          if (!transactionInfo?.meta?.err) {
            console.log(`Transaction ${transactionSignature[0]} completed successfully.`);
            inTrade=false;
          } else {
            console.log(`Transaction ${transactionSignature} failed.`);
            console.error('Error details:', transactionInfo?.meta?.err);
            tnx=transactionInfo?.meta?.err;
            status=0;
            retries=0;
            inTrade=false;
          }
        } catch (error) {
          console.error('Error checking transaction status:', error);
          status=0;
          retries=0;
          inTrade=false;
        }
      }
    } 
  }catch(Error){
    status=0;
    tnx=new String(Error);
  }
  return {status:status, tnx:tnx }
}

export function getATAAddress(programId: PublicKey, owner: PublicKey, mint: PublicKey) {
  const { publicKey, nonce } = findProgramAddress(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  );
  return { publicKey, nonce };
}

export async function sleepTime(ms: number) {
  console.log((new Date()).toLocaleString(), 'sleepTime', ms)
  return new Promise(resolve => setTimeout(resolve, ms))
}
