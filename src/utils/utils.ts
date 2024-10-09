import { MARKET_STATE_LAYOUT_V2, LIQUIDITY_STATE_LAYOUT_V4, LiquidityPoolKeys, Liquidity, Token, TOKEN_PROGRAM_ID, TokenAmount, Percent } from "@raydium-io/raydium-sdk";
import { ComputeBudgetProgram, Connection, LAMPORTS_PER_SOL, PublicKey, TransactionSignature, VersionedTransaction } from "@solana/web3.js";

import { config } from 'dotenv';
config()
const RPC_URL = process.env.RPC_URL;
const jitofees = process.env.JITOFEES;
export const connection = new Connection(RPC_URL, 'confirmed');

export  default jitofees;

export type ClusterType = "mainnet-beta" | "testnet" | "devnet" | "custom";

export const escape_markdown = (text: any) => {
  return text.replace(/([\.\+\-\|\(\)\#\_\[\]\~\=\{\}\,\!\`\>\<])/g, "\\$1").replaceAll('"', '`')
}
const SEND_AMT = 0.001 * LAMPORTS_PER_SOL;
export const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: SEND_AMT });

export const openbookProgram = new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX')
export const quoteMint = new PublicKey('So11111111111111111111111111111111111111112')


export const findMarketId = async (baseMint: PublicKey) => {

 
  let filters = [
    {
      memcmp: {
        offset: MARKET_STATE_LAYOUT_V2.offsetOf('baseMint'),
        bytes: baseMint.toBase58(),
      },
    },
    {
      memcmp: {
        offset: MARKET_STATE_LAYOUT_V2.offsetOf('quoteMint'),
        bytes: quoteMint.toBase58(),
      },
    },
  ];

  let resp: any = await connection.getProgramAccounts(openbookProgram, {
    encoding: 'base64',
    filters,
  });
 
  if (resp.length == 0) {
    filters = [
      {
        memcmp: {
          offset: MARKET_STATE_LAYOUT_V2.offsetOf('baseMint'),
          bytes: quoteMint.toBase58(),
        },
      },
      {
        memcmp: {
          offset: MARKET_STATE_LAYOUT_V2.offsetOf('quoteMint'),
          bytes: baseMint.toBase58(),
        },
      },
    ];

    resp = await connection.getProgramAccounts(openbookProgram, {
      encoding: 'base64',
      filters,
    });
   }



  const marketId = resp[0]?.pubkey;


  return marketId;

}

export const findPoolId = async (baseMint: PublicKey) => {
  let filters = [
    {
      memcmp: {
        offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('baseMint'),
        bytes: baseMint.toBase58(),
      },
    },
    {
      memcmp: {
        offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
        bytes: quoteMint.toBase58(),
      },
    },
  ];

  let resp: any = await connection.getProgramAccounts(new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'), {
    encoding: 'base64',
    filters,
  });

 
  if (resp.length == 0) {
    filters = [
      {
        memcmp: {
          offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('baseMint'),
          bytes: quoteMint.toBase58(),
        },
      },
      {
        memcmp: {
          offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
          bytes: baseMint.toBase58(),
        },
      },
    ];

    resp = await connection.getProgramAccounts(new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'), {
      encoding: 'base64',
      filters,
    });
  }

  const poolId = resp[0]?.pubkey;
  return poolId;

}



export async function sendSignedTransaction({
  signedTransaction,
  connection,
  successCallback,
  sendingCallback,
  confirmStatus,
  timeout = DEFAULT_TIMEOUT,
  skipPreflight = true,
}: {
  signedTransaction: VersionedTransaction;
  connection: Connection;
  successCallback: (txSig: string) => Promise<void>;
  sendingCallback: (txSig: string) => Promise<void>;
  confirmStatus: (txSig: string, confirmationStatus: string) => Promise<void>;
  timeout?: number;
  skipPreflight?: boolean;
}): Promise<string> {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();


  const txid: TransactionSignature = await connection.sendRawTransaction(
    rawTransaction,
    {
      skipPreflight,
    }
  );
  sendingCallback && sendingCallback(txid);

  console.log("Started awaiting confirmation for", txid);

  let done = false;
  (async () => {
    while (!done && getUnixTs() - startTime < timeout) {
      connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      await sleep(300);
    }
  })();
  try {
    await awaitTransactionSignatureConfirmation(txid, timeout, connection, confirmStatus);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.timeout) {
      throw new Error("Timed out awaiting confirmation on transaction");
    }
    const simulateResult = await connection.simulateTransaction(
      signedTransaction
    );
    if (simulateResult && simulateResult.value.err) {
      if (simulateResult.value.logs) {
        for (let i = simulateResult.value.logs.length - 1; i >= 0; --i) {
          const line = simulateResult.value.logs[i];
          if (line.startsWith("Program log: ")) {
            throw new Error(
              "Transaction failed: " + line.slice("Program log: ".length)
            );
          }
        }
      }
      confirmStatus(txid, 'AlreadyProcessed')
    }
    throw new Error("Transaction failed");
  } finally {
    done = true;
  }


  console.log("Latency", txid, Number(getUnixTs() - startTime).toFixed(0) + 'Seconds');
  successCallback && successCallback(txid);

  return txid;
}

async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature, timeout: number, connection: Connection,
  confirmStatus: (txSig: string, confirmationStatus: any) => Promise<void>) {
  let done = false;
  const result = await new Promise((resolve, reject) => {
    (async () => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        console.log("Timed out for txid", txid);
        reject({ timeout: true });
      }, timeout);
      try {
        connection.onSignature(
          txid,
          (result) => {
            console.log("WS confirmed", txid);
            done = true;
            if (result.err) {
              reject(result.err);
            } else {
              resolve(result);
            }
          },
          connection.commitment
        );
        console.log("Set up WS connection", txid);
      } catch (e) {
        done = true;
        console.log("WS error in setup", txid, e);
      }
      while (!done) {
        // eslint-disable-next-line no-loop-func
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            const result = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!result) {
                // console.log('REST null result for', txid, result);
              } else if (result.err) {
                console.log("REST error for", txid, result.confirmationStatus);
                done = true;
                confirmStatus(txid, result.confirmationStatus)
                reject(result.err);
              } else if (
                !(
                  result.confirmations ||
                  result.confirmationStatus === "confirmed" ||
                  result.confirmationStatus === "finalized"
                )
              ) {
                console.log("REST not confirmed", txid, result.confirmationStatus);
                confirmStatus(txid, result.confirmationStatus)
              } else {
                console.log("REST confirmed", txid, result.confirmationStatus);
                confirmStatus(txid, result.confirmationStatus)
                done = true;
                resolve(result);
              }
            }
          } catch (e) {
            if (!done) {
              console.log("REST connection error: txid", txid, e);
            }
          }
        })();
        await sleep(300);
      }
    })();
  });
  done = true;
  return result;
}

export const getUnixTs = () => {
  return new Date().getTime() / 1000;
};
export function getExplorerAccountLink(
  account: PublicKey,
  cluster: ClusterType
): string {
  return `https://explorer.solana.com/address/${account.toString()}?cluster=${cluster === "mainnet-beta" ? null : cluster
    }`;
}

export const isLocalhost = (url: string) => {
  return url.includes("localhost") || url.includes("127.0.0.1");
};

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function calcAmountOut(poolKeys: LiquidityPoolKeys, rawAmountIn: number, swapInDirection: boolean) {
  const poolInfo = await Liquidity.fetchInfo({ connection: connection, poolKeys })

  let currencyInMint = poolKeys.baseMint
  let currencyInDecimals = poolInfo.baseDecimals
  let currencyOutMint = poolKeys.quoteMint
  let currencyOutDecimals = poolInfo.quoteDecimals

  if (!swapInDirection) {
    currencyInMint = poolKeys.quoteMint
    currencyInDecimals = poolInfo.quoteDecimals
    currencyOutMint = poolKeys.baseMint
    currencyOutDecimals = poolInfo.baseDecimals
  }

  const currencyIn = new Token(TOKEN_PROGRAM_ID, currencyInMint, currencyInDecimals)
  const amountIn = new TokenAmount(currencyIn, rawAmountIn, false)
  const currencyOut = new Token(TOKEN_PROGRAM_ID, currencyOutMint, currencyOutDecimals)
  const slippage = new Percent(5, 100) // 5% slippage

  const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = Liquidity.computeAmountOut({
    poolKeys,
    poolInfo,
    amountIn,
    currencyOut,
    slippage,
  })

  return {
    amountIn,
    amountOut,
    minAmountOut,
    currentPrice,
    executionPrice,
    priceImpact,
    fee,
  }
}
export const TOKENS = {
  SOL: {
    symbol: 'SOL',
    name: 'Native Solana',
    mintAddress: '11111111111111111111111111111111',
    decimals: 9,
  },
  WSOL: {
    symbol: 'WSOL',
    name: 'Wrapped Solana',
    mintAddress: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  RAY: {
    symbol: 'RAY',
    name: 'Raydium',
    mintAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USDC',
    mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
  },
};
exports.TOKENS = TOKENS;
export const DEFAULT_TIMEOUT = 30000;



