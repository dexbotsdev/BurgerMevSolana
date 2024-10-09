import Client from "@triton-one/yellowstone-grpc";
import { EventEmitter } from "events";
import bs58 from "bs58";
import {
    createSubscribeTraderRequest,
} from "./utils/grpc-requests-type"
import { handleSubscribe, wsol } from "./utils/index"
import logger from "./Logger";

export const raydium_authority = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1";

interface TokenAccount {
    accountIndex: number;
    mint: string;
    uiTokenAmount: {
        uiAmount: number;
        decimals: number;
        amount: string;
        uiAmountString: string;
    };
    owner: string;
    programId: string;
}

interface PrePostBalances {
    preBalance: TokenAccount[];
    postBalance: TokenAccount[];
    routerAddress: string;
}

interface TransactionResult {
    owner: string;
    tokenMint: string;
    tokensBoughtOrSold: number;
    solSpentOrEarned: number;
    action: 'bought' | 'sold';
    pricePerToken: number;
}

export class GRPCSwapsListenerService {

    private client: any;
     private emitter: EventEmitter;
    logger: any;

    constructor(
        grpcUrl: string,
         grpcToken: string | undefined,
         grpcOptions: any = { "grpc.max_receive_message_length": 64 * 1024 * 1024 },
         emitterInstance: EventEmitter
    ) {
        this.client = new Client(grpcUrl,grpcToken==null?undefined:grpcToken, grpcOptions);
        this.emitter = emitterInstance;
        this.initialize();
        this.logger = logger;
    }

    async initialize() {
        const version = await this.client.getVersion();
        this.logger.info(version);
     }
 
    calculateTransaction({ preBalance, postBalance, routerAddress }: PrePostBalances): TransactionResult[] {
        const results: TransactionResult[] = [];
        const WSOL_MINT = 'So11111111111111111111111111111111111111112'; // WSOL mint address
        const NATIVE_SOL_MINT = '11111111111111111111111111111111'; // Native SOL address

        const preMap = new Map<string, TokenAccount>();
        const postMap = new Map<string, TokenAccount>();

        preBalance.forEach(account => {
            const key = `${account.owner}-${account.mint}`;
            preMap.set(key, account);
        });

        postBalance.forEach(account => {
            const key = `${account.owner}-${account.mint}`;
            postMap.set(key, account);
        });

        postMap.forEach((postAccount, key) => {
            const preAccount = preMap.get(key);
            if (postAccount.owner === routerAddress) return;

            const preAmount = preAccount ? preAccount.uiTokenAmount.uiAmount : 0;
            const postAmount = postAccount.uiTokenAmount.uiAmount;
            const tokenMint = postAccount.mint;

            if (preAmount !== postAmount) {
                const change = postAmount - preAmount;
                let action: 'bought' | 'sold';
                let solSpentOrEarned = 0;
                let tokensBoughtOrSold = 0;

                if (tokenMint !== WSOL_MINT && tokenMint !== NATIVE_SOL_MINT) {
                    tokensBoughtOrSold = Math.abs(change);
                    action = change > 0 ? 'bought' : 'sold';

                    const solKey = `${postAccount.owner}-${WSOL_MINT}`;
                    const preSolAccount = preMap.get(solKey);
                    const postSolAccount = postMap.get(solKey);

                    const solPreAmount = preSolAccount ? preSolAccount.uiTokenAmount.uiAmount : 0;
                    const solPostAmount = postSolAccount ? postSolAccount.uiTokenAmount.uiAmount : 0;

                    solSpentOrEarned = solPreAmount - solPostAmount;

                    if (solSpentOrEarned === 0) {
                        const nativeSolKey = `${postAccount.owner}-${NATIVE_SOL_MINT}`;
                        const preNativeSolAccount = preMap.get(nativeSolKey);
                        const postNativeSolAccount = postMap.get(nativeSolKey);

                        solSpentOrEarned = preNativeSolAccount ? preNativeSolAccount.uiTokenAmount.uiAmount - postNativeSolAccount.uiTokenAmount.uiAmount : 0;
                    }

                    const pricePerToken = solSpentOrEarned !== 0 ? solSpentOrEarned / tokensBoughtOrSold : 0;

                    results.push({
                        owner: postAccount.owner,
                        tokenMint,
                        tokensBoughtOrSold,
                        solSpentOrEarned: Math.abs(solSpentOrEarned),
                        action,
                        pricePerToken: Math.abs(pricePerToken),
                    });
                }
            }
        });

        return results;
    }

    async streamTargetTrader() {
        try {
            this.logger.info(`Starting Swap Listener`);
            const stream = await this.client.subscribe();
            const r1 = await createSubscribeTraderRequest();
            handleSubscribe(stream, r1);

            stream.on("data", (data: any) => {
                if (data.transaction) {
                    const preTokenBalances = data.transaction.transaction.meta.preTokenBalances;
                    const postTokenBalances = data.transaction.transaction.meta.postTokenBalances;

                    const results = this.calculateTransaction({
                        preBalance: preTokenBalances,
                        postBalance: postTokenBalances,
                        routerAddress: raydium_authority,
                    });
                    // const latestBlockhash = await connection.getLatestBlockhash("processed");
                    let targetToken = "", postPoolSOL = 0, postPoolToken = 0, prePoolSOL = 0, prePoolToken = 0, side = "";
                    // look for the token that the trader is buying or selling

                    for (const account of preTokenBalances) {
                        if (targetToken !== "" && prePoolSOL !== 0 && prePoolToken !== 0) break; // make sure we get the target token and pool sol balances and trader address only
                        if (account.owner === raydium_authority && account.mint !== wsol) targetToken = account.mint;
                        if (account.owner === raydium_authority && account.mint === wsol) {
                            prePoolSOL = account.uiTokenAmount.uiAmount;
                        }
                        if (account.owner === raydium_authority && account.mint !== wsol) {
                            prePoolToken = account.uiTokenAmount.uiAmount;
                        }

                    }
                    for (const account of postTokenBalances) {
                        if (postPoolSOL !== 0 && postPoolToken !== 0) break; // make sure we get the target token and pool sol balances and trader address only
                        if (account.owner === raydium_authority && account.mint !== wsol) targetToken = account.mint;
                        if (account.owner === raydium_authority && account.mint === wsol) {
                            postPoolSOL = account.uiTokenAmount.uiAmount;
                        }
                        if (account.owner === raydium_authority && account.mint !== wsol) {
                            postPoolToken = account.uiTokenAmount.uiAmount;

                        }

                    }
                    if (targetToken === "") return;
                    let swappedSOLAmount = 0, swappedTokenAmount = 0;
                    if (postPoolSOL > prePoolSOL) {
                        side = "buy";
                        swappedSOLAmount = postPoolSOL - prePoolSOL;
                        swappedTokenAmount = prePoolToken - postPoolToken;
                    }
                    else {
                        side = "sell";
                        swappedSOLAmount = prePoolSOL - postPoolSOL;
                        swappedTokenAmount = postPoolToken - prePoolToken;
                    }

                    if (results.length > 0) {

                        results.forEach(result => {
                            const jsonObject = {
                                signature: bs58.encode(data?.transaction?.transaction?.signature),
                                owner: result.owner,
                                token: result.tokenMint,
                                action: result.action,
                                tokensBoughtOrSold: result.tokensBoughtOrSold,
                                sol: swappedSOLAmount,
                                pricePerToken: postPoolSOL / postPoolToken
                            };

                            //this.logger.info("New swap detected");
                            //console.log(jsonObject)
                            this.emitter.emit('newSwapDetected', JSON.stringify(jsonObject));
                        });

                    }
                }
            });

            stream.on("error", (err: any) => {
                this.logger.error("Error in stream", err);
            });
        } catch (error) {
            this.logger.error("Failed to stream target trader", error);
        }
    }
}
