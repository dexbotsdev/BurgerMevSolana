import { promisify } from 'util';
import { createInterface } from 'readline';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

export interface SwapData {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    priceImpactPct: string;
  }

rl.question[promisify.custom] = (arg) => {
    return new Promise((resolve) => {
        rl.question(arg, resolve);
    });
};

export  function calculateProfitAndRoute(swap1: SwapData, swap2: SwapData) {
    // Convert amounts to numbers for calculations
    const solMint = 'So11111111111111111111111111111111111111112';
    const initialAmountSOL = Number(swap1.inAmount);
    const minTokenReceived = Number(swap1.otherAmountThreshold);
    const minSolAfterSwap = Number(swap2.otherAmountThreshold);
  
    // Calculate profit
    const profit = (minSolAfterSwap - initialAmountSOL) / 1e9; // Convert lamports to SOL
    const tokenAddress = swap1.outputMint;
  
    // Determine if trade route is profitable
    const profitable = profit > 0;
  
    // Output results
    console.log('Trade Route Analysis:');
    console.log(`Token Address: ${tokenAddress}`);
    console.log(`Initial SOL: ${initialAmountSOL / 1e9} SOL`);
    console.log(`Tokens to Buy: ${minTokenReceived}`);
    console.log(`Tokens to Sell: ${minSolAfterSwap / 1e9} SOL`);
  
    if (profitable) {
      console.log(`Profit: ${profit.toFixed(8)} SOL`);
      console.log('Recommendation: Buy the token and sell back to SOL.');
    } else {
      console.log(`Loss: ${profit.toFixed(8)} SOL`);
      console.log('Recommendation: Avoid this trade route.');
    }

    return Number(profit.toFixed(4))
  }

export const question = promisify(rl.question);

