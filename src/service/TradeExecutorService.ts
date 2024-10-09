import { Connection, PublicKey, Keypair, Transaction, AddressLookupTableAccount, TransactionInstruction, ComputeBudgetProgram, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import { createJupiterApiClient, DefaultApi } from '@jup-ag/api';
import bs58 from 'bs58'; // For decoding wallet private key
import { calculateProfitAndRoute } from './HelperUtils';
import { bundleBuilder } from '../clients/jito';

class TradeExecutorService {
    private connection: Connection;
    private jupiter: DefaultApi;

    constructor(clientUri: string, rpcUrl: string) {
        this.connection = new Connection(rpcUrl);
        this.jupiter = createJupiterApiClient({ basePath: clientUri });
    }

    async executeTrade(tokenAddress: string, walletPrivateKey: string, inputAmount: number) {
        try {
            // 1. Decode wallet private key
            const walletKeypair = Keypair.fromSecretKey(bs58.decode(walletPrivateKey));
            const walletPublicKey = walletKeypair.publicKey;

 
 
            const quoteResponsePre = await (
                await fetch(`https://quote-api.jup.ag/v6/quote?swapMode=ExactIn&inputMint=So11111111111111111111111111111111111111112&outputMint=${tokenAddress}&amount=${inputAmount}&slippageBps=25`  )
            ).json();
        

            console.log(' Create a buy+sell transaction: using Jupiter');

            // 2. Create a buy transaction
            const buyAndSellTransactions = await this.createSwapTransaction(tokenAddress, walletKeypair, inputAmount, quoteResponsePre.otherAmountThreshold);

 
            if(buyAndSellTransactions)
            {
                await bundleBuilder(this.connection, [buyAndSellTransactions], walletKeypair)
            }




        } catch (error) {
            console.error('Error executing trade:', error);
        }
    }

    // Helper method to create swap transaction
    private async createSwapTransaction(tokenAddress: string, walletKeypair: Keypair, amount: Number, tokenAmount: number) {

        console.log(tokenAddress + ":" + amount + ":" + tokenAmount)


        const wallet = walletKeypair;

        const quoteResponse = await (
            await fetch(`https://quote-api.jup.ag/v6/quote?swapMode=ExactOut&inputMint=So11111111111111111111111111111111111111112&outputMint=${tokenAddress}&amount=${tokenAmount}&slippageBps=25`
            )
        ).json();
        const quoteResponse2 = await (
            await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${tokenAddress}&outputMint=So11111111111111111111111111111111111111112&amount=${tokenAmount}&slippageBps=25`
            )
        ).json();


        console.log(quoteResponse)
        console.log(quoteResponse2)


        const repeatCalc = calculateProfitAndRoute(quoteResponse, quoteResponse2)


        if (Number(repeatCalc) < 0) {

            console.log('Price Impact changed in seconds, so returning back no trades')
            return null;

        }
        else {
            console.log('Executing Trade since its a Profit ' + repeatCalc)


            const instructions = await (
                await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        quoteResponse,
                        userPublicKey: wallet.publicKey.toBase58(),
                    })
                })
            ).json();
            const instructions2 = await (
                await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        quoteResponse: quoteResponse2,
                        userPublicKey: wallet.publicKey.toBase58(),
                    })
                })
            ).json();

            if (instructions.error) {
                throw new Error("Failed to get swap instructions: " + instructions.error);
            }
            if (instructions2.error) {
                throw new Error("Failed to get swap instructions: " + instructions.error);
            }

            const {
                tokenLedgerInstruction, // If you are using `useTokenLedger = true`.
                computeBudgetInstructions, // The necessary instructions to setup the compute budget.
                setupInstructions, // Setup missing ATA for the users.
                swapInstruction: swapInstructionPayload, // The actual swap instruction.
                cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
                addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
            } = instructions;



            const deserializeInstruction = (instruction: any) => {
                return new TransactionInstruction({
                    programId: new PublicKey(instruction.programId),
                    keys: instruction.accounts.map((key: { pubkey: PublicKey; isSigner: any; isWritable: any; }) => ({
                        pubkey: new PublicKey(key.pubkey),
                        isSigner: key.isSigner,
                        isWritable: key.isWritable,
                    })),
                    data: Buffer.from(instruction.data, "base64"),
                });
            };

            const getAddressLookupTableAccounts = async (
                keys: string[]
            ): Promise<AddressLookupTableAccount[]> => {
                const addressLookupTableAccountInfos =
                    await this.connection.getMultipleAccountsInfo(
                        keys.map((key) => new PublicKey(key))
                    );

                return addressLookupTableAccountInfos.reduce((acc: any, accountInfo: any, index: any) => {
                    const addressLookupTableAddress = keys[Number(index)];
                    if (accountInfo) {
                        const addressLookupTableAccount = new AddressLookupTableAccount({
                            key: new PublicKey(addressLookupTableAddress),
                            state: AddressLookupTableAccount.deserialize(accountInfo.data),
                        });
                        acc.push(addressLookupTableAccount);
                    }

                    return acc;
                }, new Array<AddressLookupTableAccount>());
            };

            const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

            addressLookupTableAccounts.push(
                ...(await getAddressLookupTableAccounts(addressLookupTableAddresses))
            );

            const finalInst: TransactionInstruction[] = [
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
                ...setupInstructions.map(deserializeInstruction),
                deserializeInstruction(swapInstructionPayload),
                deserializeInstruction(instructions2.swapInstruction),
                deserializeInstruction(cleanupInstruction),
            ]
            const lookupTablesSwapMain = addressLookupTableAccounts;
            const recentBlockhashForSwap = await this.connection.getLatestBlockhash('finalized')

            const versionedTransaction = new VersionedTransaction(
                new TransactionMessage({
                    payerKey: wallet.publicKey,
                    recentBlockhash: recentBlockhashForSwap.blockhash,
                    instructions: finalInst,
                }).compileToV0Message(...[lookupTablesSwapMain])
            );

            versionedTransaction.sign([wallet]);

            return versionedTransaction;

        }

    }


}


export default TradeExecutorService;