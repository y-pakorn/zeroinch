import { Address } from "viem"

import { IToken } from "@/types"

export const WETH = "0x4200000000000000000000000000000000000006"
export const USDC = "0x0b2c639c533813f4aa9d7837caf62653d097ff85"

export const tokens: Record<Address, IToken> = {
  // "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": {
  //   chainId: 10,
  //   symbol: "ETH",
  //   name: "Ether",
  //   address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  //   decimals: 18,
  //   logoURI:
  //     "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
  //   providers: [
  //     "1inch",
  //     "CMC200 ERC20",
  //     "CMC Stablecoin",
  //     "CoinGecko",
  //     "Compound",
  //     "Curve Token List",
  //     "Defiprime",
  //     "Dharma Token List",
  //     "Messari Verified",
  //     "PancakeSwap Extended",
  //     "PancakeSwap Top 100",
  //     "Quickswap Token List",
  //     "Roll Social Money",
  //     "SpookySwap Default List",
  //     "Synthetix",
  //     "Trust Wallet Assets",
  //     "Uniswap Labs Default",
  //     "Zerion",
  //   ],
  //   eip2612: false,
  //   isFoT: false,
  //   tags: ["crosschain", "GROUP:ETH", "native", "PEG:ETH", "RISK:availability"],
  // },
  "0x4200000000000000000000000000000000000006": {
    chainId: 10,
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png",
    providers: ["1inch", "Kleros Tokens", "Messari Verified"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:WETH", "PEG:ETH", "RISK:unverified", "tokens"],
  },
  "0x8700daec35af8ff88c16bdf0418774cb3d7599b4": {
    chainId: 10,
    symbol: "SNX",
    name: "Synthetix Network Token",
    address: "0x8700daec35af8ff88c16bdf0418774cb3d7599b4",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0x8700daec35af8ff88c16bdf0418774cb3d7599b4_0x781352d44aaff378f4f0121088ed9a6f1a78f0f2e51e829c879b9345429ba7d7.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:SNX", "RISK:unverified", "tokens"],
  },
  "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": {
    chainId: 10,
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xda10009cbd5d07dd0cecc66161fc93d7c9000da1.png",
    providers: [
      "1inch",
      "Arbed Arb Whitelist Era",
      "Kleros Tokens",
      "Messari Verified",
      "Roll Social Money",
    ],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:DAI", "PEG:USD", "RISK:unverified", "tokens"],
  },
  "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": {
    chainId: 10,
    symbol: "USDT",
    name: "Tether USD",
    address: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
    decimals: 6,
    logoURI:
      "https://tokens.1inch.io/0x94b008aa00579c1307b0ef2c499ad98a8ce58e58.png",
    providers: ["1inch", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:USDT", "PEG:USD", "RISK:unverified", "tokens"],
  },
  "0x68f180fcce6836688e9084f035309e29bf0a2095": {
    chainId: 10,
    symbol: "WBTC",
    name: "Wrapped BTC",
    address: "0x68f180fcce6836688e9084f035309e29bf0a2095",
    decimals: 8,
    logoURI:
      "https://tokens.1inch.io/0x68f180fcce6836688e9084f035309e29bf0a2095.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:WBTC", "PEG:BTC", "RISK:unverified", "tokens"],
  },
  "0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6": {
    chainId: 10,
    symbol: "LINK",
    name: "ChainLink Token",
    address: "0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:LINK", "RISK:unverified", "tokens"],
  },
  "0x7f5c764cbc14f9669b88837ca1490cca17c31607": {
    chainId: 10,
    symbol: "USDC.e",
    name: "USD Coin",
    address: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
    decimals: 6,
    logoURI:
      "https://tokens.1inch.io/0x7f5c764cbc14f9669b88837ca1490cca17c31607.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: [
      "crosschain",
      "GROUP:USDC.e",
      "PEG:USD",
      "RISK:unverified",
      "tokens",
    ],
  },
  "0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9": {
    chainId: 10,
    symbol: "sUSD",
    name: "Synth sUSD",
    address: "0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x57ab1ec28d129707052df4df418d58a2d46d5f51.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:sUSD", "PEG:USD", "RISK:unverified", "tokens"],
  },
  "0x217d47011b23bb961eb6d93ca9945b7501a5bb11": {
    chainId: 10,
    symbol: "THALES",
    name: "Thales DAO Token",
    address: "0x217d47011b23bb961eb6d93ca9945b7501a5bb11",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x217d47011b23bb961eb6d93ca9945b7501a5bb11.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0x61baadcf22d2565b0f471b291c475db5555e0b76": {
    chainId: 10,
    symbol: "AELIN",
    name: "Aelin Token",
    address: "0x61baadcf22d2565b0f471b291c475db5555e0b76",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x61baadcf22d2565b0f471b291c475db5555e0b76.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0x7fb688ccf682d58f86d7e38e03f9d22e7705448b": {
    chainId: 10,
    symbol: "RAI",
    name: "Rai Reflex Index",
    address: "0x7fb688ccf682d58f86d7e38e03f9d22e7705448b",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x7fb688ccf682d58f86d7e38e03f9d22e7705448b.png",
    providers: ["1inch", "Trust Wallet Assets"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:RAI", "RISK:unverified", "tokens"],
  },
  "0x9e1028f5f1d5ede59748ffcee5532509976840e0": {
    chainId: 10,
    symbol: "PERP",
    name: "Perpetual",
    address: "0x9e1028f5f1d5ede59748ffcee5532509976840e0",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x9e1028f5f1d5ede59748ffcee5532509976840e0.png",
    providers: ["1inch", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: [
      "crosschain",
      "GROUP:COMP",
      "GROUP:PERP",
      "RISK:unverified",
      "tokens",
    ],
  },
  "0xf98dcd95217e15e05d8638da4c91125e59590b07": {
    chainId: 10,
    symbol: "KROM",
    name: "Kromatika",
    address: "0xf98dcd95217e15e05d8638da4c91125e59590b07",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xf98dcd95217e15e05d8638da4c91125e59590b07.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:KROM", "RISK:unverified", "tokens"],
  },
  "0x4200000000000000000000000000000000000042": {
    chainId: 10,
    symbol: "OP",
    name: "Optimism",
    address: "0x4200000000000000000000000000000000000042",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x4200000000000000000000000000000000000042.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "PEG:OP", "RISK:unverified", "tokens"],
  },
  "0xeeeeeb57642040be42185f49c52f7e9b38f8eeee": {
    chainId: 10,
    symbol: "ELK",
    name: "Elk",
    address: "0xeeeeeb57642040be42185f49c52f7e9b38f8eeee",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xeeeeeb57642040be42185f49c52f7e9b38f8eeee.png",
    providers: [
      "1inch",
      "BA ERC20 SEC Action",
      "CMC200 ERC20",
      "CMC Stablecoin",
      "CoinGecko",
      "Compound",
      "Curve Token List",
      "Defiprime",
      "Dharma Token List",
      "Messari Verified",
      "PancakeSwap Extended",
      "PancakeSwap Top 100",
      "Quickswap Token List",
      "Roll Social Money",
      "SpookySwap Default List",
      "Synthetix",
      "Trust Wallet Assets",
      "Uniswap Labs Default",
      "Zerion",
    ],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:ELK", "RISK:unverified", "tokens"],
  },
  "0xe405de8f52ba7559f9df3c368500b6e6ae6cee49": {
    chainId: 10,
    symbol: "sETH",
    name: "Synth sETH",
    address: "0xe405de8f52ba7559f9df3c368500b6e6ae6cee49",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xe405de8f52ba7559f9df3c368500b6e6ae6cee49.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:sETH", "PEG:ETH", "RISK:unverified", "tokens"],
  },
  "0x73cb180bf0521828d8849bc8cf2b920918e23032": {
    chainId: 10,
    symbol: "USD+",
    name: "USD+",
    address: "0x73cb180bf0521828d8849bc8cf2b920918e23032",
    decimals: 6,
    logoURI:
      "https://tokens.1inch.io/0x73cb180bf0521828d8849bc8cf2b920918e23032.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:USD+", "PEG:USD", "RISK:unverified", "tokens"],
  },
  "0x296f55f8fb28e498b858d0bcda06d955b2cb3f97": {
    chainId: 10,
    symbol: "STG",
    name: "StargateToken",
    address: "0x296f55f8fb28e498b858d0bcda06d955b2cb3f97",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x296f55f8fb28e498b858d0bcda06d955b2cb3f97.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:STG", "RISK:unverified", "tokens"],
  },
  "0x8ae125e8653821e851f12a49f7765db9a9ce7384": {
    chainId: 10,
    symbol: "DOLA",
    name: "Dola USD Stablecoin",
    address: "0x8ae125e8653821e851f12a49f7765db9a9ce7384",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x8ae125e8653821e851f12a49f7765db9a9ce7384.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:DOLA", "PEG:USD", "RISK:unverified", "tokens"],
  },
  "0xb0b195aefa3650a6908f15cdac7d92f8a5791b0b": {
    chainId: 10,
    symbol: "BOB",
    name: "BOB",
    address: "0xb0b195aefa3650a6908f15cdac7d92f8a5791b0b",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xb0b195aefa3650a6908f15cdac7d92f8a5791b0b.png",
    providers: [
      "1inch",
      "Agora dataFi Tokens",
      "BA ERC20 SEC Action",
      "CMC200 ERC20",
      "CMC Stablecoin",
      "Compound",
      "Curve Token List",
      "Defiprime",
      "Furucombo",
      "Gemini Token List",
      "Kleros Tokens",
      "Roll Social Money",
      "SpookySwap Default List",
      "Synthetix",
      "Trust Wallet Assets",
      "Uniswap Labs Default",
      "Zerion",
    ],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:BOB", "RISK:unverified", "tokens"],
  },
  "0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc": {
    chainId: 10,
    symbol: "HOP",
    name: "Hop",
    address: "0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc_0xe9b4c9861c7d13d3c6d6b303c2c82c84bd4e0bb4559c9d3dc7cf85d737268e15.webp",
    providers: [
      "1inch",
      "CMC DeFi",
      "CMC Stablecoin",
      "Messari Verified",
      "Trust Wallet Assets",
    ],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0x1f32b1c2345538c0c6f582fcb022739c4a194ebb": {
    chainId: 10,
    symbol: "wstETH",
    name: "Wrapped liquid staked Ether 2.0",
    address: "0x1f32b1c2345538c0c6f582fcb022739c4a194ebb",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x1f32b1c2345538c0c6f582fcb022739c4a194ebb.png",
    providers: ["1inch"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:Wst ETH", "RISK:unverified", "tokens"],
  },
  "0x920cf626a271321c151d027030d5d08af699456b": {
    chainId: 10,
    symbol: "KWENTA",
    name: "Kwenta",
    address: "0x920cf626a271321c151d027030d5d08af699456b",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x920cf626a271321c151d027030d5d08af699456b.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0x3e29d3a9316dab217754d13b28646b76607c5f04": {
    chainId: 10,
    symbol: "alETH",
    name: "Alchemix ETH",
    address: "0x3e29d3a9316dab217754d13b28646b76607c5f04",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x3e29d3a9316dab217754d13b28646b76607c5f04.png",
    providers: ["1inch"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:alETH", "RISK:unverified", "tokens"],
  },
  "0xcb8fa9a76b8e203d8c3797bf438d8fb81ea3326a": {
    chainId: 10,
    symbol: "alUSD",
    name: "Alchemix USD",
    address: "0xcb8fa9a76b8e203d8c3797bf438d8fb81ea3326a",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xcb8fa9a76b8e203d8c3797bf438d8fb81ea3326a.png",
    providers: ["1inch", "CoinGecko", "Messari Verified", "Roll Social Money"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:alUSD", "RISK:unverified", "tokens"],
  },
  "0x0994206dfe8de6ec6920ff4d779b0d950605fb53": {
    chainId: 10,
    symbol: "CRV",
    name: "Curve DAO Token",
    address: "0x0994206dfe8de6ec6920ff4d779b0d950605fb53",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png",
    providers: ["1inch", "Kleros Tokens", "Trust Wallet Assets"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:CRV", "RISK:unverified", "tokens"],
  },
  "0x9bcef72be871e61ed4fbbc7630889bee758eb81d": {
    chainId: 10,
    symbol: "rETH",
    name: "Rocket Pool ETH",
    address: "0x9bcef72be871e61ed4fbbc7630889bee758eb81d",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x9bcef72be871e61ed4fbbc7630889bee758eb81d.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:rETH", "RISK:unverified", "tokens"],
  },
  "0xdfa46478f9e5ea86d57387849598dbfb2e964b02": {
    chainId: 10,
    symbol: "MAI",
    name: "Mai Stablecoin",
    address: "0xdfa46478f9e5ea86d57387849598dbfb2e964b02",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xdfa46478f9e5ea86d57387849598dbfb2e964b02.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:MAI", "RISK:unverified", "tokens"],
  },
  "0x2e3d870790dc77a83dd1d18184acc7439a53f475": {
    chainId: 10,
    symbol: "FRAX",
    name: "Frax",
    address: "0x2e3d870790dc77a83dd1d18184acc7439a53f475",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0x2e3d870790dc77a83dd1d18184acc7439a53f475_0xe7eea26c1509f1571d7eb86d1ba1afe0391e70451cb245b6a31a25741b8828a4.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:FRAX", "RISK:unverified", "tokens"],
  },
  "0x76fb31fb4af56892a25e32cfc43de717950c9278": {
    chainId: 10,
    symbol: "AAVE",
    name: "Aave Token",
    address: "0x76fb31fb4af56892a25e32cfc43de717950c9278",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0x76fb31fb4af56892a25e32cfc43de717950c9278_0x84bcf4c9b00562ebbd4ce06dc0e46eede2968dff46e9c0c75405fee82ad0e4c1.webp",
    providers: ["1inch", "Kleros Tokens", "Trust Wallet Assets"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:AAVE", "RISK:unverified", "tokens"],
  },
  "0x00a35fd824c717879bf370e70ac6868b95870dfb": {
    chainId: 10,
    symbol: "IB",
    name: "IronBank",
    address: "0x00a35fd824c717879bf370e70ac6868b95870dfb",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x00a35fd824c717879bf370e70ac6868b95870dfb.png",
    providers: ["1inch", "Trust Wallet Assets"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0x5a5fff6f753d7c11a56a52fe47a177a87e431655": {
    chainId: 10,
    symbol: "SYN",
    name: "Synapse",
    address: "0x5a5fff6f753d7c11a56a52fe47a177a87e431655",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/18024/large/syn.png?1635002049",
    providers: ["1inch"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0xaf9fe3b5ccdae78188b1f8b9a49da7ae9510f151": {
    chainId: 10,
    symbol: "DHT",
    name: "dHEDGE DAO Token",
    address: "0xaf9fe3b5ccdae78188b1f8b9a49da7ae9510f151",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xaf9fe3b5ccdae78188b1f8b9a49da7ae9510f151.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:DHT", "RISK:unverified", "tokens"],
  },
  "0x0b2c639c533813f4aa9d7837caf62653d097ff85": {
    chainId: 10,
    symbol: "USDC",
    name: "USD Coin",
    address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    decimals: 6,
    logoURI:
      "https://tokens.1inch.io/0x0b2c639c533813f4aa9d7837caf62653d097ff85.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:USDC", "RISK:unverified", "tokens"],
    displayedSymbol: "USDC",
  },
  "0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40": {
    chainId: 10,
    symbol: "tBTC",
    name: "Optimism tBTC v2",
    address: "0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40_0x7e000d463431f246428a1faf4a3595e4f537a0d5e7b67dd87e816aa7fa723080.png",
    providers: [
      "1inch",
      "CoinGecko",
      "Kleros Tokens",
      "Messari Verified",
      "Roll Social Money",
    ],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:tBTC", "PEG:BTC", "RISK:unverified", "tokens"],
  },
  "0x9560e827af36c94d2ac33a39bce1fe78631088db": {
    chainId: 10,
    symbol: "VELO",
    name: "VelodromeV2",
    address: "0x9560e827af36c94d2ac33a39bce1fe78631088db",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x9560e827af36c94d2ac33a39bce1fe78631088db.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0x1e925de1c68ef83bd98ee3e130ef14a50309c01b": {
    chainId: 10,
    symbol: "EXA",
    name: "exactly",
    address: "0x1e925de1c68ef83bd98ee3e130ef14a50309c01b",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x1e925de1c68ef83bd98ee3e130ef14a50309c01b.png",
    providers: ["1inch"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1": {
    chainId: 10,
    symbol: "WLD",
    name: "Worldcoin",
    address: "0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1_0xc12c62f9cfca0307779436715b00792303380c5002d502da9622e2e11d19b13a.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0x528cdc92eab044e1e39fe43b9514bfdab4412b98": {
    chainId: 10,
    symbol: "GIV",
    name: "Giveth Token",
    address: "0x528cdc92eab044e1e39fe43b9514bfdab4412b98",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0x528cdc92eab044e1e39fe43b9514bfdab4412b98_0x9c50dae564f8162d007e07d8e013a4e8e8acda3afa751e1a8561e90e514aa3f0.png",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:GIV", "RISK:unverified"],
  },
  "0xbc7b1ff1c6989f006a1185318ed4e7b5796e66e1": {
    chainId: 10,
    symbol: "PENDLE",
    name: "Pendle",
    address: "0xbc7b1ff1c6989f006a1185318ed4e7b5796e66e1",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0xbc7b1ff1c6989f006a1185318ed4e7b5796e66e1_0xaaf571e89fe5b431824b10015de441deee3a703e2435633e0270926c026e9de2.webp",
    providers: ["1inch", "CoinGecko", "Kleros Tokens"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:PENDLE", "RISK:unverified", "tokens"],
  },
  "0xc55e93c62874d8100dbd2dfe307edc1036ad5434": {
    chainId: 10,
    symbol: "mooBIFI",
    name: "Moo BIFI",
    address: "0xc55e93c62874d8100dbd2dfe307edc1036ad5434",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xc55e93c62874d8100dbd2dfe307edc1036ad5434.png",
    providers: ["1inch", "Trust Wallet Assets"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0xf467c7d5a4a9c4687ffc7986ac6ad5a4c81e1404": {
    chainId: 10,
    symbol: "KITE",
    name: "Protocol Token",
    address: "0xf467c7d5a4a9c4687ffc7986ac6ad5a4c81e1404",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0xf467c7d5a4a9c4687ffc7986ac6ad5a4c81e1404_0x13287829e86a1abb448e5b5ba460c6ef3a8435630eb0b84799cef36e566881d7.png",
    providers: ["1inch"],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0x59d9356e565ab3a36dd77763fc0d87feaf85508c": {
    chainId: 10,
    symbol: "USDM",
    name: "Mountain Protocol USD",
    address: "0x59d9356e565ab3a36dd77763fc0d87feaf85508c",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0x59d9356e565ab3a36dd77763fc0d87feaf85508c_0x3fbc5aca6527a258463e18aaa16865508be8baeba9e4b1eb0a6a2aa68c035bcc.png",
    providers: [
      "1inch",
      "Arbed Arb Whitelist Era",
      "CMC DeFi",
      "CMC Stablecoin",
      "Roll Social Money",
      "Trust Wallet Assets",
    ],
    eip2612: true,
    isFoT: false,
    tags: ["crosschain", "GROUP:USDM", "PEG:USD", "RISK:unverified", "tokens"],
  },
  "0x6985884c4392d348587b19cb9eaaf157f13271cd": {
    chainId: 10,
    symbol: "ZRO",
    name: "LayerZero",
    address: "0x6985884c4392d348587b19cb9eaaf157f13271cd",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0x6985884c4392d348587b19cb9eaaf157f13271cd_0x3661b65e21293658cdc6678b32fb8b78c344f26cbd5e6836528b21f8c15bab7e.png",
    providers: [
      "1inch",
      "BA ERC20 SEC Action",
      "CMC200 ERC20",
      "CMC Stablecoin",
      "Compound",
      "Curve Token List",
      "Defiprime",
      "Furucombo",
      "Gemini Token List",
      "Kleros Tokens",
      "Messari Verified",
      "Roll Social Money",
      "SpookySwap Default List",
      "Synthetix",
      "Trust Wallet Assets",
      "Uniswap Labs Default",
      "Zerion",
    ],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "GROUP:ZRO", "RISK:unverified", "tokens"],
  },
  "0x139052115f8b1773cf7dcba6a553f922a2e54f69": {
    chainId: 10,
    symbol: "(=ↀωↀ=)",
    name: "Nekocoin",
    address: "0x139052115f8b1773cf7dcba6a553f922a2e54f69",
    decimals: 6,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0x139052115f8b1773cf7dcba6a553f922a2e54f69_0x0fbed2ccf0e413109b0c7826e75fecf3b9e428e7c38fbcd6fb9755da03bb602c.png",
    providers: ["1inch"],
    eip2612: false,
    isFoT: false,
    tags: ["crosschain", "RISK:unverified", "tokens"],
  },
  "0xef4461891dfb3ac8572ccf7c794664a8dd927945": {
    chainId: 10,
    symbol: "WCT",
    name: "WalletConnect",
    address: "0xef4461891dfb3ac8572ccf7c794664a8dd927945",
    decimals: 18,
    logoURI:
      "https://tokens-data.1inch.io/images/10/0xef4461891dfb3ac8572ccf7c794664a8dd927945_0x6ee56018406b6bdd00b4a4921af7b91cb7377557f3c56b1b4b2384aefd31e590.png",
    providers: ["1inch", "Trust Wallet Assets"],
    eip2612: true,
    isFoT: false,
    tags: ["GROUP:WCT", "RISK:unverified", "tokens"],
  },
}
