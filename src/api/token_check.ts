import { web3 } from "@project-serum/anchor";
import { Mint } from "@solana/spl-token";
import { RaydiumPoolLayout } from "./raydium";
import LamaVesting, { VestingPoolLayout } from "./lama_vesting";
import { FluxbeamPoolLayout } from "./fluxbeam";
import { PublicKey } from "@solana/web3.js";
import { deserializeMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { connection as web3connection } from "../config";

const RAYDIUM = new web3.PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8")
const OPENBOOK = new web3.PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX")
const FLUXBEAM = new web3.PublicKey("FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X")
export const METADATA_2022_PROGRAM_ID = new web3.PublicKey("META4s4fSmpkTbZoUsgC1oBnWB31vQcmnN8giPw51Zu")
export const PROGRAM_ID = new web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

var a = JSON.parse('{"5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1":{"name":"Raydium AMM","type":"AMM"},"CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK":{"name":"Raydium CLAMM","type":"AMM"},"CPK8fQYShAmERZmysQRAGWPvV5qs3AvazQsiR9ctC6ED":{"name":"Raydium CLAMM LP","type":"AMM"},"whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc":{"name":"Orca Whirlpool","type":"AMM"},"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v":{"name":"USDC","type":"token"},"USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX":{"name":"USDH","type":"token"},"So11111111111111111111111111111111111111112":{"name":"SOL","type":"token"},"4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R":{"name":"Raydium","type":"token"},"beamazjPnFT3JQoe16HjUxkpmHFfsHY6dTqf3VwBXzq":{"name":"FluxBeam LP","type":"AMM"},"USRfPB8M8pfbrFnEt3FDf3Y8ZmU4G17wcRsWBUK416m":{"name":"FluxBot User Rewards","type":"AMM"},"RESWbt45deYa8F7mQ53pGGJ3XECYC15EGK7cM738mrN":{"name":"FluxBot Reserves","type":"AMM"}}')


export class TokenCheck {


    connection: web3.Connection
    mint: web3.PublicKey

    lamaVesting: LamaVesting

    rugged = false

    //@ts-ignore
    token: Mint

    tokenType = "spl-token"

    //@ts-ignore
    tokenMeta: any

    //@ts-ignore
    locker: web3.PublicKey.get

    //@ts-ignore
    fileMeta: any

    //@ts-ignore
    markets: any

    totalLPLiquidity = 0

    transferFee = {
        pct: 0,
        maxAmount: 0,
        authority: null
    }

    //@ts-ignore
    topHolders: web3.TokenAccountBalancePair[]

    tokenCache = {};

    knownAccounts = {};

    priceCache: any = {}

    burnAcc = "burn68h9dS2tvZwtCFMt79SyaEgvqtcZZWJphizQxgt"

    lockerOwners: Map<string, boolean> = new Map([
        ["vestwXyjHjcaqbTwNXSyn5HKMt6U3D5NcfdjQHJWVyG", true],
        ["beamazjPnFT3JQoe16HjUxkpmHFfsHY6dTqf3VwBXzq", true],
        ["1ockKL5chR89E4K576QfJP6jeW9v5cNoPjxKyZmJ7us", true],
        ["USRfPB8M8pfbrFnEt3FDf3Y8ZmU4G17wcRsWBUK416m", true],
        ["RESWbt45deYa8F7mQ53pGGJ3XECYC15EGK7cM738mrN", true]
    ])

    mylog = (dat: any, ...args: any[]) => {

        console.log(dat, args);

    }
    constructor(tokenAddress: string) {
        this.connection = web3connection;
        this.mint = new PublicKey(tokenAddress);
        this.knownAccounts = JSON.parse('{"5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1":{"name":"Raydium AMM","type":"AMM"},"CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK":{"name":"Raydium CLAMM","type":"AMM"},"CPK8fQYShAmERZmysQRAGWPvV5qs3AvazQsiR9ctC6ED":{"name":"Raydium CLAMM LP","type":"AMM"},"whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc":{"name":"Orca Whirlpool","type":"AMM"},"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v":{"name":"USDC","type":"token"},"USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX":{"name":"USDH","type":"token"},"So11111111111111111111111111111111111111112":{"name":"SOL","type":"token"},"4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R":{"name":"Raydium","type":"token"},"beamazjPnFT3JQoe16HjUxkpmHFfsHY6dTqf3VwBXzq":{"name":"FluxBeam LP","type":"AMM"},"USRfPB8M8pfbrFnEt3FDf3Y8ZmU4G17wcRsWBUK416m":{"name":"FluxBot User Rewards","type":"AMM"},"RESWbt45deYa8F7mQ53pGGJ3XECYC15EGK7cM738mrN":{"name":"FluxBot Reserves","type":"AMM"}}')
        this.lamaVesting = new LamaVesting(this.connection)
        //this.loadTokenCache()
    }

    loadTokenCache() {
        const rt = localStorage.getItem("v2:recent_tokens");
        this.tokenCache = rt ? JSON.parse(rt) : {};
    }

    setPriceCache(cache = {}) {
        //@ts-ignore
        this.priceCache = cache
    }

    getCachedPrice(address: web3.PublicKey) {
        //@ts-ignore
        return this.priceCache[address.toString()]
    }

    isV2() {
        return this.tokenType === "spl-token-2022"
    }

    /**
     * Returns the price of the token
     * TODO Add in support for V2
     * @param id
     */
    async getPrice(id: web3.PublicKey, result: any): Promise<number> {

        this.mylog("Getting price: ", id.toString())


        if (id.toString() === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
            return 1 //Jup API bases off USDC

        //@ts-ignore
        if (this.priceCache[id.toString()]) {
            //@ts-ignore
            this.mylog("returning cache", id.toString(), this.priceCache[id.toString()])

            result.price = this.priceCache[id.toString()].price;
            //@ts-ignore    
            return this.priceCache[id.toString()].price || 0
        }

        const resp = await fetch(`https://price.jup.ag/v4/price?ids=${id}`)
        const priceData = await resp.json()

        if (!priceData?.data[id.toString()]?.price) {
            this.mylog(`No price for ${id.toString()}`, priceData)

            result.price = 0;

            return 0
        }

        this.mylog("Price", id.toString(), priceData.data[id.toString()].price)

        //@ts-ignore
        this.priceCache[id.toString()] = priceData.data[id.toString()]
        return priceData.data[id.toString()].price
    }

    async check() {
        let result = {
            score: 0,
            price: 0, 
            freezeAuth: false,
            mintAuth: false,
            //@ts-ignore
            risks: [],
            ammLiquidityPct:0,
            ammLiquidity :0
        };

        //Get price in BG
      //  await this.getPrice(this.mint, result)

        //Get Token
        const tokenData = await this.getToken(this.mint)
        this.mylog("tokenData", tokenData)

        //@ts-ignore
        this.tokenType = tokenData.value?.data.program

        //@ts-ignore
        this.token = tokenData?.value?.data.parsed?.info as Mint
        this.mylog("this.token", this.token, this.isV2())
        if (!this.token)
            throw new Error("Unable to get token account")

        this.mylog(this.mint.toString(), this.token)
        await this._analyseToken(result)

        if (this.isV2()) {
            this._analyseTokenExtensions(result)
        }

        //Get Metadata
        this.tokenMeta = await this.getTokenMetadata().catch(e => {
        })
        if (!this.tokenMeta) {
            //@ts-ignore
            this.tokenMeta = { updateAuthority: null, data: { name: "Unknown" } }

            //@ts-ignore
            result.risks.push({
                //@ts-ignore
                name: "No token metadata found",
                //@ts-ignore
                score: 0,
                //@ts-ignore
                description: "No metadata is assigned to the token."
            })
        } else {
            this.mylog("tokenMeta", this.tokenMeta)
            await this._analyseMetadata(result)
        }


        const topHolders = await this.connection.getTokenLargestAccounts(this.mint, "confirmed")
        this.topHolders = topHolders.value
        // this.mylog("topHolders", this.topHolders)


        const holderKeys: web3.PublicKey[] = []
        this.topHolders.forEach((h) => holderKeys.push(h.address))
        const accountInfo = await this.connection.getMultipleParsedAccounts(holderKeys)

        //@ts-ignore
        accountInfo.value.forEach((a, k) => this.topHolders[k].data = a.data?.parsed)

        this._analyseHolders(result)


        // const openbook = await this.getOpenbookMarkets(this.mint)
        // openbook.forEach((m) => {
        // 	//@ts-ignore
        // 	m.marketType = "openbook"
        // 	// this.mylog("openbook market", m.pubkey.toString(), m)
        // })


        // this.mylog("getting fluxbeam markets")
        // const fluxMarkets = await this.getFluxbeamMarkets(this.mint)
        // fluxMarkets.forEach((m: any) => {
        //     //@ts-ignore
        //     m.marketType = "fluxbeam"
        // })

        const rayMarkets = await this.getRaydiumMarkets(this.mint)
        rayMarkets.forEach((m: any) => {
            //@ts-ignore
            m.marketType = "raydium"
        })

        // this.markets = raydium.concat(openbook)
        this.markets = rayMarkets
        this.mylog("Markets", this.markets)

        this.totalLPLiquidity = 0
        const promises = [];
        for (let i = 0; i < this.markets.length; i++) {
            promises.push(this._analyseMarket(result, i))
        }

        const results = await Promise.all(promises);
        for (let i = 0; i < results.length; i++) {
            //@ts-ignore
            this.totalLPLiquidity += results[i]
        }

        //@ts-ignore
        this.markets = this.markets.filter(f => f.lp)

        // const mktPrice = await this.getPrice(this.mint)
        // const mktCap = ((Number(this.token.supply) / Math.pow(10, this.token.decimals)) * mktPrice);

        let totalLPHolders = 0;
        for (let i = 0; i < this.markets.length; i++) {
            this.mylog("Checking Market", this.markets[i])
            const mkt = this.markets[i]

            if (!this.markets[i].lp || !mkt.lp?.quoteUSD)
                continue //We dont have market info

            this.markets[i].lp.pctSupply = (mkt.lp.quoteUSD / this.totalLPLiquidity) * 100

            totalLPHolders += mkt.lp.holders.length
            const supplyPerLPHolder = mkt.lp.pctSupply / mkt.lp.holders.length
            this.mylog("supplyPerLPHolder", supplyPerLPHolder)
            if (supplyPerLPHolder > 10 && mkt.lp?.pctReserve > 20) {
                result.risks.push({
                    //@ts-ignore
                    name: "Large Amount of LP Unlocked", score: (mkt.lp.pctSupply * 100),
                    //@ts-ignore
                    description: "A large amount of LP tokens are unlocked, allowing the owner to remove liquidity at any point."
                })
            }
        }


        if (totalLPHolders > 0 && totalLPHolders <= 5) {
            //@ts-ignore
            result.risks.push({
                //@ts-ignore
                name: "Low amount of LP Providers",
                //@ts-ignore
                level: "warn",
                //@ts-ignore
                score: (totalLPHolders),
                //@ts-ignore
                description: "Only a few users are providing liquidity"
            })
        }

        this.markets.sort((a: any, b: any) => b.lp?.quoteUSD - a.lp?.quoteUSD)

        if (this.totalLPLiquidity === 0) {

            result.risks.push({
                //@ts-ignore
                name: "Unknown Liquidity",
                //@ts-ignore
                value: `$${this.totalLPLiquidity.toFixed(2)}`,
                //@ts-ignore
                level: "warn",
                //@ts-ignore
                score: 1000,
                //@ts-ignore
                description: "No Liquidity Markets Detected"
            })


        } else if (this.totalLPLiquidity < 3000) {
            const risk = (3000 - this.totalLPLiquidity) * 2;
            result.risks.push({
                //@ts-ignore
                name: "Low Liquidity",
                //@ts-ignore
                value: `$${this.totalLPLiquidity.toFixed(2)}`,
                //@ts-ignore
                level: risk > 900 ? "danger" : "warn",
                //@ts-ignore
                score: risk,
                //@ts-ignore
                description: "Low amount of liquidity in the token pool"
            })


            this.mylog("Quote Liq", this.totalLPLiquidity, risk)
            if (risk > 990 && (this.totalLPLiquidity > 0 && this.totalLPLiquidity < 10)) {
                this.rugged = true
            }
        }


        //@ts-ignore
        result.risks.forEach((r) => result.score += Number(r.score))


        //Check known entity
        const s1 = this.revStr("64gdFVDE1dF3ThPmBXULF")
        const s2 = this.revStr("XREWzTnbE4h1npyNeBHqERY")
        if (this.mint === new web3.PublicKey(s1 + s2)) {
            result.score = 10
            result.risks = [];
        }


        return result
    }

    async _analyseToken(result: any) {
        if (!this.token) {
            result.risks.push({ name: "No token found", score: 10000, description: "No token found on chain" })
            return
        }

        if (this.token.freezeAuthority !== null && this.token.freezeAuthority.toString() !== "11111111111111111111111111111111") {
            result.risks.push({
                name: "Freeze Authority still enabled",
                score: 500,
                description: "Tokens can be frozen and prevented from trading"
            })

            result.freezeAuth = true;
        }

        if (this.token.mintAuthority !== null && this.token.mintAuthority.toString() !== "11111111111111111111111111111111") {
            const authority = await this.connection.getParsedAccountInfo(new web3.PublicKey(this.token.mintAuthority), "confirmed")
            if (!authority.value) {
                this.mylog("Authority account does not exist")
            } else if (this.lockerOwners.get(authority.value!.owner!.toString())) {
                //@ts-ignore
                this.token.mintAuthorityLocked = true

                result.risks.push({
                    name: "Mint Authority locked",
                    level: "warn",
                    score: 0,
                    description: "The ability to mint tokens is locked"
                })
            } else {

                this.mylog("mintAuthority", authority.value?.owner.toString())
                result.mintAuth = true;

                result.risks.push({
                    name: "Mint Authority still enabled",
                    score: 50000,
                    description: "More tokens can be minted by the owner"
                })
            }
        }
    }

    _analyseTokenExtensions(result: any) {
        //@ts-ignore
        this.mylog("Extensions", this.token?.extensions?.length)

        //@ts-ignore
        this.token?.extensions?.forEach(ext => {
            this.mylog("Ext", ext)
            this._analyseExtension(ext, result)
        })
    }

    _analyseExtension(ext: any, result: any) {
        switch (ext.extension) {
            case "transferFeeConfig":
                this.mylog("_analyseExtension", ext.state.newerTransferFee.transferFeeBasisPoints, ext.state.transferFeeConfigAuthority)

                this.transferFee = {
                    pct: ext.state.newerTransferFee.transferFeeBasisPoints,
                    maxAmount: ext.state.newerTransferFee.maximumFee,
                    authority: ext.state.transferFeeConfigAuthority,
                }


                if (ext.state.newerTransferFee.transferFeeBasisPoints > 2000)
                    result.risks.push({
                        name: "High transfer fee",
                        value: `${ext.state.newerTransferFee.transferFeeBasisPoints / 100}%`,
                        score: ext.state.newerTransferFee.transferFeeBasisPoints * 10,
                        description: "Each transfer of this token incurs a high tax"
                    })

                if (ext.state.transferFeeConfigAuthority)
                    result.risks.push({
                        name: "Fee config enabled",
                        score: 200,
                        level: 'warn',
                        description: "The owner can change the fees ay any time"
                    })
                break
        }
    }

    async _analyseMetadata(result: any) {
        if (!this.tokenMeta) {
            result.risks.push({
                name: "Missing metadata",
                score: 0,
                description: "No token metadata found relating to this token"
            })
            return
        }

        if (this.tokenMeta.isMutable) {
            result.risks.push({
                name: "Mutable metadata",
                level: "warn",
                score: 100,
                description: "Token metadata can be changed by the owner"
            })
        }

        if (this.toName(this.tokenMeta.uri) === "") {
            result.risks.push({
                name: "Missing file metadata",
                score: 0,
                description: "No file metadata found associated to this token"
            })
            return //We cant go further due to missing metadata
        } else {
            this.fileMeta = await this.getFileMetadata().then(res => res).catch(err => null)
            this.mylog("fileMetadata", this.fileMeta)
            //  this.updateTokenCache();

            if (!this.fileMeta?.name) {
                result.risks.push({
                    name: "Missing Metadata",
                    score: 0,
                    description: "Metadata file is missing for token"
                })
                return
            }
        }

        //@ts-ignore
        document.querySelector("link[rel='apple-touch-icon']").href = this.fileMeta.image;

        const tn = this.toName(this.tokenMeta.data.name)
        if (tn !== this.fileMeta.name) {
            result.risks.push({
                name: "Name Mismatch",
                score: 0,
                description: "Token name does not match the file metadata"
            })
        }

        const ts = this.toName(this.tokenMeta.data.symbol)
        if (ts !== this.fileMeta.symbol) {
            result.risks.push({
                name: "Symbol Mismatch",
                score: 0,
                description: "Token symbol does not match the file metadata"
            })
        }
    }


    _analyseHolders(result: any) {
        const total_supply = Number(this.token.supply)

        let top10 = 0;
        let total = 0;
        this.topHolders.forEach(((h, key) => {

            //@ts-ignore
            const pct = (h.amount / total_supply) * 100

            //@ts-ignore
            const known = this.knownAccounts[h.data?.info.owner.toString() || h.address.toString()]

            if(known && known.type == 'AMM'){
                result.ammLiquidityPct = pct;
                result.ammLiquidity = h.amount;
            }
            if (key < 10 && (!known || known.type !== 'AMM')) {
                top10 += pct
                total += pct
            }


            //@ts-ignore
            h.pct = pct

            if (pct > 20 && (!known || known.type !== 'AMM')) {
                result.risks.push({
                    name: "Single holder ownership",
                    description: "One user holds a large amount of the token supply",
                    value: `${pct.toFixed(0)}%`,
                    level: pct > 40 ? "danger" : 'warn',
                    score: total * 100
                })
            }
        }))

        if (top10 > 70) {
            result.risks.push({
                name: "Top 10 holders high ownership",
                description: "The top 10 users hold more than 70% token supply",
                level: "danger",
                score: 1000 + top10 * 100
            })
        } else if (top10 > 50) {
            result.risks.push({
                name: "High holder concentration",
                description: "The top 10 users hold more than 50% token supply",
                level: "warn",
                score: 500 + top10 * 10
            })
        }

        if (total > 80) {
            result.risks.push({
                name: "High ownership",
                description: `The top ${this.topHolders.length} users hold more than 80% token supply`,
                level: "danger",
                score: 500 + total * 100
            })
        }
    }

    async _analyseMarket(result: any, i: any) {
        if (this.isV2() || this.markets[i].marketType === "fluxbeam") {
            return this._analyseFluxbeamMarket(result, i)
        }

        return this._analyseRaydiumMarket(result, i)
    }

    async _analyseFluxbeamMarket(result: any, i: any) {
        //@ts-ignore
        this.markets[i].data = FluxbeamPoolLayout.decode(this.markets[i].account.data)
        this.mylog("_analyseFluxbeamMarket::1", this.markets[i].data)

        if (this.markets[i].data?.quoteMint.toString() === "11111111111111111111111111111111")
            return //Nothing to do

        //@ts-ignore
        const validMints = {
            "So11111111111111111111111111111111111111112": true,
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": true
        }
        //@ts-ignore
        validMints[this.mint] = true


        //@ts-ignore
        this.mylog("CHECK", validMints[this.markets[i].data?.baseMint.toString()], validMints[this.markets[i].data?.quoteMint.toString()])
        //@ts-ignore
        if (validMints[this.markets[i].data?.baseMint.toString()] && validMints[this.markets[i].data?.quoteMint.toString()]) {
            //
        } else {
            this.mylog("FLUX SKIPPING", i, this.markets[i].data?.baseMint.toString(), this.markets[i].data?.quoteMint.toString())
            return  //Not a base mint
        }

        //@ts-ignore
        // market.price = baseLiq.value.uiAmount/quoteLiq.value.uiAmount

        const ts = await this.connection.getTokenSupply(this.markets[i].data.lpMint, "confirmed");
        this.markets[i].data.lpReserve = ts.value.amount

        const md = this.markets[i].data
        this.markets[i].lp = await this._analyseLP(result, md.tokenAccountA, md.tokenAccountB, md.baseMint, md.quoteMint, md.lpMint, md.lpReserve)
        this.mylog("_analyseFluxbeamMarket", {
            lp: this.markets[i].lp,
            md: md,
        })

        if (md.baseMint.toString() === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
            const poolPrice = this.markets[i].lp.base / this.markets[i].lp.quote
            //@ts-ignore
            this.priceCache[md.quoteMint.toString()] = { mint: md.quoteMint.toString(), price: poolPrice }

            return poolPrice * this.markets[i].lp.quote
        } else if (md.quoteMint.toString() === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
            const poolPrice = this.markets[i].lp.quote / this.markets[i].lp.base
            //@ts-ignore
            this.priceCache[md.baseMint.toString()] = { mint: md.baseMint.toString(), price: poolPrice }

            return poolPrice * this.markets[i].lp.base
        }

        //TOOD Change to sending liquidity of both so we can check later on
        return this.markets[i].lp?.quoteUSD
    }

    async _analyseRaydiumMarket(result: any, i: any) {
        //@ts-ignore
        this.markets[i].data = RaydiumPoolLayout.decode(this.markets[i].account.data)

        if (this.markets[i].data?.quoteMint.toString() === "11111111111111111111111111111111")
            return //Nothing to do

        //@ts-ignore
        const validMints = {
            "So11111111111111111111111111111111111111112": true,
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": true,
        }
        //@ts-ignore
        validMints[this.mint] = true

        //@ts-ignore
        this.mylog("CHECK", validMints[this.markets[i].data?.baseMint.toString()], validMints[this.markets[i].data?.quoteMint.toString()])
        //@ts-ignore
        if (validMints[this.markets[i].data?.baseMint.toString()] && validMints[this.markets[i].data?.quoteMint.toString()]) {
            //
        } else {
            this.mylog("SKIPPING", i, this.markets[i].data?.baseMint.toString(), this.markets[i].data?.quoteMint.toString())
            return  //Not a base mint
        }

        //@ts-ignore
        // market.price = baseLiq.value.uiAmount/quoteLiq.value.uiAmount

        const md = this.markets[i].data
        this.markets[i].lp = await this._analyseLP(result, md.baseVault, md.quoteVault, md.baseMint, md.quoteMint, md.lpMint, md.lpReserve)
        this.mylog("_analyseMarket", this.markets[i].lp)

        //TOOD Change to sending liquidity of both so we can check later on
        return this.markets[i].lp?.quoteUSD
    }


    async _analyseLP(result: any, baseVault: web3.PublicKey, quoteVault: web3.PublicKey, baseMint: web3.PublicKey, quoteMint: web3.PublicKey, lpMint: web3.PublicKey, lpReserve: web3.PublicKey) {
        const quoteLiq = await this.connection.getTokenAccountBalance(quoteVault, "confirmed")
        const baseLiq = await this.connection.getTokenAccountBalance(baseVault, "confirmed")
        const quotePrice = await this.getPrice(quoteMint, result)

        const lpSupply = await this.connection.getTokenSupply(lpMint, "confirmed")
        const holders = await this.connection.getTokenLargestAccounts(lpMint, "confirmed")

        const topHolders = holders.value


        this.mylog("total_supply", {
            quoteMint: quoteMint.toString(),
            base: baseLiq.value.uiAmount!,
            quote: quoteLiq.value.uiAmount!,
            price: quotePrice,
            liquidityUSDC: (quoteLiq.value.uiAmount! * quotePrice),
            liquiditySOL: quoteLiq.value.uiAmount,
        })

        result.quoteMint = quoteMint.toString(),
            result.base = baseLiq.value.uiAmount!,
            result.quote = quoteLiq.value.uiAmount!,
            result.price = quotePrice
        result.liquidityUSDC = (quoteLiq.value.uiAmount! * quotePrice);
        result.liquiditySOL = quoteLiq.value.uiAmount;

        const holderKeys: web3.PublicKey[] = []
        //@ts-ignore
        topHolders.forEach(((h, key) => {
            holderKeys.push(h.address)
        }));

        const accountInfo = await this.connection.getMultipleParsedAccounts(holderKeys)
        this.mylog("lp topHolders accountInfo", accountInfo)

        const ownerKeys: web3.PublicKey[] = []
        //@ts-ignore
        accountInfo.value.forEach((a, k) => {
            //@ts-ignore
            ownerKeys.push(new web3.PublicKey(a.data?.parsed?.info.owner))

            //@ts-ignore
            topHolders[k].data = a.data?.parsed
        })

        const ownerAccountInfo = await this.connection.getMultipleParsedAccounts(ownerKeys)
        // this.mylog("lp ownerKeys accountInfo", {
        // 	ownerKeys: ownerKeys.length,
        // 	infoLen: ownerAccountInfo.value.length,
        // 	ownerAccountInfo
        // })

        let ownerAIdx = 0;
        for (let i = 0; i < ownerKeys.length; i++) {
            if (ownerKeys[i].toString() === "11111111111111111111111111111111")
                continue

            //TODO We could also parse the Vest/Locker accounts here if needed
            //@ts-ignore
            topHolders[i].owner = ownerAccountInfo.value[ownerAIdx]?.owner || ""
            ownerAIdx++
        }


        //Calculate our risk
        let totalUnlocked = 0;
        let totalPctUnlocked = 0;
        let totalTokensUnlocked = 0

        const vaultInfo = await this.lamaVesting.getLockersByMint(lpMint)
        for (let i = 0; i < vaultInfo.length; i++) {
            await this._analyseVault(result, vaultInfo[i])
        }

        //@ts-ignore
        topHolders.forEach(((h, key) => {

            //@ts-ignore
            const pct = (h.uiAmount! / lpSupply.value.uiAmount!) * 100
            let locked;


            //@ts-ignore
            if (h.owner.toString() === this.burnAcc || h.data?.info.owner.toString() === this.burnAcc) {
                locked = true
            }
            //@ts-ignore
            else if (this.lockerOwners.has(h.owner.toString()) || this.lockerOwners.has(h.data?.info.owner.toString())) {
                locked = true //Locked in a vault which has already been checked
            } else if (h.uiAmount! > 0) {
                totalUnlocked += h.uiAmount! * quotePrice //Add to our unlocked score
                totalTokensUnlocked += Number(h.amount)
            }

            totalPctUnlocked += locked ? 0 : pct

            //@ts-ignore
            h.pct = locked ? 0 : pct || 0
            //@ts-ignore
            h.locked = locked
        }))


        const quoteUSD = (quoteLiq.value.uiAmount! * quotePrice)
        const lpReserveUI = Number(lpReserve) / Math.pow(10, 5)

        let pctReserve: number;
        if (lpSupply.value.uiAmount! <= 0) { //0 in pool
            pctReserve = 0
        } else {
            pctReserve = (Number(totalTokensUnlocked) / Number(lpSupply.value.amount)) * 100
        }
        const pctUnlocked = (Number(totalTokensUnlocked) / Number(this.token.supply)) * 100
        const lpTotal = Number(lpReserve) + Number(lpSupply.value.amount)

        console.debug("liq", {
            quoteMint: quoteMint.toString(),
            quotePrice,
            totalUnlocked,
            totalTokensUnlocked,
            lpSupplyAmount: lpSupply.value.amount,
            quoteLiq: quoteLiq.value,
            tokenSupply: Number(this.token.supply),
            lpSupply: lpSupply.value.uiAmount!,
            lpReserveUI,
            lpTotal,
            // lpPct: (lpSupply.value.uiAmount! / lpTotal) * 100,
            lpPct: (totalTokensUnlocked / lpTotal) * 100,
        })

        result = {
            ...result,
            base: baseLiq.value.uiAmount!,
            quote: quoteLiq.value.uiAmount!,
            reserveSupply: Number(lpReserve),
            currentSupply: lpSupply.value.uiAmount!,
            quoteUSD: quoteUSD,
            // pctReserve: pctReserve,
            // pctReserve: lpSupply.value.uiAmount! > 0 ? lpReserveUI / (lpSupply.value.uiAmount!) : 0,
            // pctReserve: lpSupply.value.uiAmount! > 0 ? (lpSupply.value.uiAmount! / lpTotal) * 100 : 0,
            pctReserve: lpSupply.value.uiAmount! > 0 ? ((totalTokensUnlocked * 2) / lpTotal) * 100 : 0,
            pctSupply: pctUnlocked,
            holders: topHolders,
            totalTokensUnlocked,
        }

        return {
            base: baseLiq.value.uiAmount!,
            quote: quoteLiq.value.uiAmount!,
            reserveSupply: Number(lpReserve),
            currentSupply: lpSupply.value.uiAmount!,
            quoteUSD: quoteUSD,
            // pctReserve: pctReserve,
            // pctReserve: lpSupply.value.uiAmount! > 0 ? lpReserveUI / (lpSupply.value.uiAmount!) : 0,
            // pctReserve: lpSupply.value.uiAmount! > 0 ? (lpSupply.value.uiAmount! / lpTotal) * 100 : 0,
            pctReserve: lpSupply.value.uiAmount! > 0 ? ((totalTokensUnlocked * 2) / lpTotal) * 100 : 0,
            pctSupply: pctUnlocked,
            holders: topHolders,
            totalTokensUnlocked,
        }
    }

    async _analyseVault(result: any, vault: any) {
        const locked = VestingPoolLayout.decode(vault.account?.data!)

        const tn = Date.now() / 1000
        const timeLeft = Number(locked.sequence[0].releaseTime) - tn
        const unlockInHours = timeLeft / 3600;

        if (unlockInHours < 0) {
            const vaultTokenAcc = await this.connection.getParsedAccountInfo(locked.tokenAccount, "confirmed").catch()
            if (vaultTokenAcc) {
                //@ts-ignore
                const amountInVault = vaultTokenAcc.value?.data?.parsed.info.tokenAmount.uiAmount
                const absHours = Math.abs(Math.floor(timeLeft / 3600))

                console.warn("LP Locker unlocked!", amountInVault, timeLeft, `${Math.floor(timeLeft / 86400)} Days`, `${Math.floor(timeLeft / 3600)} Hours`, locked, vaultTokenAcc)
                if (amountInVault > 0)
                    result.risks.push({
                        name: "LP Vault unlocked",
                        value: `${absHours} Hours ago`,
                        level: "danger",
                        score: 10000 + (absHours * 100),
                        description: "The LP Pool tokens in the vault are able to be reclaimed."
                    })
            }

        } else if (unlockInHours < 24 * 14) {
            console.warn("LP Unlocking soon!", timeLeft, `${timeLeft / 86400} Days`, `${timeLeft / 3600} Hours`, locked)

            result.risks.push({
                name: "LP unlocking in",
                value: `${Math.floor(timeLeft / 3600)} Hours`,
                level: "danger",
                score: (24 * 14 * 100) - (Math.floor(timeLeft / 3600) * 100),
                description: "The LP Pool tokens will unlock soon allowing the owner to remove their liquidity."
            })
        } else {
            result.risks.push({
                name: "LP Locked for",
                value: `${Math.floor(timeLeft / 86400)} Days`,
                level: "warn",
                score: 500,
                description: "The LP Pool tokens have been locked, but not burnt so can still be reclaimed at some point."
            })
        }
    }

    async getToken(tokenMint: web3.PublicKey) {
        return this.connection.getParsedAccountInfo(tokenMint, "confirmed")

        // return getMint(this.connection, tokenMint, "confirmed")
    }

    async findTokenMetadataPda(mint) {
        return PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata", "utf8"),
                new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
                new PublicKey(mint).toBuffer(),
            ],
            new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
        )[0];
    }

    async findToken2022MetadataPda(mint) {
        return PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata", "utf8"),
                new PublicKey("META4s4fSmpkTbZoUsgC1oBnWB31vQcmnN8giPw51Zu").toBuffer(),
                new PublicKey(mint).toBuffer(),
            ],
            new PublicKey("META4s4fSmpkTbZoUsgC1oBnWB31vQcmnN8giPw51Zu")
        )[0];
    }

    async getTokenMetadata() {
        //@ts-ignore
        if (this.tokenCache[this.mint.toString()]) {
            this.mylog(`CACHE:SKIP getTokenMetadata`)
            //@ts-ignore
            return this.tokenCache[this.mint.toString()].token
        }

        const tokenMetadataPda = await this.findTokenMetadataPda(this.mint);
        const tokenMetadataAccount = await this.connection
            .getAccountInfo(tokenMetadataPda)
            .catch((e) => null);
        if (tokenMetadataAccount) return deserializeMetadata(tokenMetadataAccount);

        const token2022MetadataPda = await this.findToken2022MetadataPda(this.mint);
        const token2022MetadataAccount = await this.connection
            .getAccountInfo(token2022MetadataPda)
            .catch((e) => null);
        if (token2022MetadataAccount)
            return deserializeMetadata(token2022MetadataAccount);
        return null;


    }

    async getFileMetadata() {
        //@ts-ignore
        if (this.tokenCache[this.mint.toString()]) {
            this.mylog(`CACHE:SKIP getFileMetadata`)
            //@ts-ignore
            return this.tokenCache[this.mint.toString()].meta
        }

        let uri = this.toName(this.tokenMeta.uri)
        if (uri.indexOf("gateway.ipfscdn.io") > -1) //Thirdweb charges for access now
            uri = `${uri.replace("gateway.ipfscdn.io/ipfs/", "")}.ipfs.nftstorage.link`

        this.mylog("Getting File Metadata", uri)
        const resp = await fetch(uri)
        if (resp.status !== 200)
            return {}

        return await resp.json()
    }

    async getOpenbookMarkets(tokenMint: web3.PublicKey) {
        return this.connection.getProgramAccounts(OPENBOOK, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: 5 + 8 + 32 + 8, //BaseMint
                        // offset: 5 + 8 + 32 + 8 + 32,
                        bytes: tokenMint.toString()
                    }
                }
            ]
        })
    }

    async getRaydiumMarkets(tokenMint: web3.PublicKey) {
        const markets = await this.connection.getProgramAccounts(RAYDIUM, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: (30 * 8) + 64 + 32 + 64, //BaseMint
                        bytes: tokenMint.toString()
                    }
                }
            ]
        })


        const inverseMarkets = await this.connection.getProgramAccounts(RAYDIUM, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: (30 * 8) + 64 + 32 + 64 + 32, //QuoteMint
                        bytes: tokenMint.toString()
                    }
                }
            ]
        })


        return markets.concat(...inverseMarkets)
    }

    async getFluxbeamMarkets(tokenMint: web3.PublicKey) {
        const markets = await this.connection.getProgramAccounts(FLUXBEAM, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: 3 + (4 * 32), //BaseMint
                        bytes: tokenMint.toString()
                    }
                }
            ]
        })

        const inverseMarkets = await this.connection.getProgramAccounts(FLUXBEAM, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: 3 + (5 * 32), //QuoteMint
                        bytes: tokenMint.toString()
                    }
                }
            ]
        })


        return markets.concat(...inverseMarkets)
    }

    toName(str: any): string {
        //@ts-ignore
        const b = Buffer.from(str)
        const i = b.indexOf(0x00);
        return b.subarray(0, i).toString()
    }

    updateTokenCache() {
        const rt = localStorage.getItem("v1:recent_tokens");
        const tokenSearch = rt ? JSON.parse(rt) : {};
        tokenSearch[this.mint.toString()] = {
            token: this.tokenMeta,
            meta: this.fileMeta
        }
        localStorage.setItem("v1:recent_tokens", JSON.stringify(tokenSearch))
    }

    revStr(str: string) {
        return str.split('').reverse().join('');
    }
}