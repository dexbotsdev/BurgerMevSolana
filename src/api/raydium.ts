import {web3} from "@project-serum/anchor";
import {struct} from "@solana/buffer-layout";
import {publicKey, u128, u64} from "@solana/buffer-layout-utils";

export interface RaydiumPool {
	status: bigint;
	nonce: bigint;
	maxOrder: bigint;
	depth: bigint;
	baseDecimal: bigint;
	quoteDecimal: bigint;
	state: bigint;
	resetFlag: bigint;
	minSize: bigint;
	volMaxCutRatio: bigint;
	amountWaveRatio: bigint;
	baseLotSize: bigint;
	quoteLotSize: bigint;
	minPriceMultiplier: bigint;
	maxPriceMultiplier: bigint;
	systemDecimalValue: bigint;
	minSeparateNumerator: bigint;
	minSeparateDenominator: bigint;
	tradeFeeNumerator: bigint;
	tradeFeeDenominator: bigint;
	pnlNumerator: bigint;
	pnlDenominator: bigint;
	swapFeeNumerator: bigint;
	swapFeeDenominator: bigint;
	baseNeedTakePnl: bigint;
	quoteNeedTakePnl: bigint;
	quoteTotalPnl: bigint;
	baseTotalPnl: bigint;
	quoteTotalDeposited: bigint;
	baseTotalDeposited: bigint;
	swapBaseInAmount: bigint;
	swapQuoteOutAmount: bigint;
	swapBase2QuoteFee: bigint;
	swapQuoteInAmount: bigint;
	swapBaseOutAmount: bigint;
	swapQuote2BaseFee: bigint;
	baseVault: web3.PublicKey;
	quoteVault: web3.PublicKey;
	baseMint: web3.PublicKey;
	quoteMint: web3.PublicKey;
	lpMint: web3.PublicKey;
	openOrders: web3.PublicKey;
	marketId: web3.PublicKey;
	marketProgramId: web3.PublicKey;
	targetOrders: web3.PublicKey;
	withdrawQueue: web3.PublicKey;
	lpVault: web3.PublicKey;
	owner: web3.PublicKey;
	lpReserve: bigint;
}

export const RaydiumPoolLayout = struct<RaydiumPool>([
	u64("status"),
	u64("nonce"),
	u64("maxOrder"),
	u64("depth"),
	u64("baseDecimal"),
	u64("quoteDecimal"),
	u64("state"),
	u64("resetFlag"),
	u64("minSize"),
	u64("volMaxCutRatio"),
	u64("amountWaveRatio"),
	u64("baseLotSize"),
	u64("quoteLotSize"),
	u64("minPriceMultiplier"),
	u64("maxPriceMultiplier"),
	u64("systemDecimalValue"),
	u64("minSeparateNumerator"),
	u64("minSeparateDenominator"),
	u64("tradeFeeNumerator"),
	u64("tradeFeeDenominator"),
	u64("pnlNumerator"),
	u64("pnlDenominator"),
	u64("swapFeeNumerator"),
	u64("swapFeeDenominator"),
	u64("baseNeedTakePnl"),
	u64("quoteNeedTakePnl"),
	u64("quoteTotalPnl"),
	u64("baseTotalPnl"),
	u128("quoteTotalDeposited"),
	u128("baseTotalDeposited"),
	u128("swapBaseInAmount"),
	u128("swapQuoteOutAmount"),
	u64("swapBase2QuoteFee"),
	u128("swapQuoteInAmount"),
	u128("swapBaseOutAmount"),
	u64("swapQuote2BaseFee"),
	// amm vault
	publicKey("baseVault"),
	publicKey("quoteVault"),
	// mint
	publicKey("baseMint"),
	publicKey("quoteMint"),
	publicKey("lpMint"),
	// market
	publicKey("openOrders"),
	publicKey("marketId"),
	publicKey("marketProgramId"),
	publicKey("targetOrders"),
	publicKey("withdrawQueue"),
	publicKey("lpVault"),
	publicKey("owner"),
	// true circulating supply without lock up
	u64("lpReserve"),
]);