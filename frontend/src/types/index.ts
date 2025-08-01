import { LimitOrder } from "@1inch/limit-order-sdk"
import type { Address, Hex } from "viem"

export interface IAccount {
  seed: Hex
  notes: INote[]
  orders: IOrder[]
}

export interface INote {
  addedAt: number
  hash: Hex
  balance: number
  address: Address
  leafIndex: number
  _note: IPrimitiveNote
}

export interface IPrimitiveNote {
  combinedSecret: ICombinedSecret
  asset_balance: bigint
  asset_address: Hex
}

export interface ICombinedSecret {
  secret: Hex
  nonce: Hex
}

export type IOrder = ILimitOrder

export interface IToken {
  address: Address
  chainId: number
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  providers: string[]
  eip2612: boolean
  isFoT: boolean
  tags: string[]
  displayedSymbol?: string
}

export interface ILimitOrder {
  id: Hex
  normalizedOrderHash: Hex
  type: "limit"
  baseTokenA: Address
  quoteTokenA: Address
  baseTokenAmount: number
  minQuoteTokenAmount: number
  marketPrice: number
  value: number // baseTokenAmount * baseTokenPrice
  expiredAt: number
  createdAt: number
  diffPercentage: number
  rate: number
  combinedSecret: ICombinedSecret
  oneInchOrder: LimitOrder
  cancelPreImage: Hex
  cancelHash: Hex
  txHash: Hex
  filled?: {
    at: number
    noteHash: Hex
    leafIndex: number
    txHash: Hex
    actualQuoteTokenAmount: number
  }
  cancelled?: {
    at: number
    txHash: Hex
    noteHash: Hex
    leafIndex: number
  }
}

// export interface ITwapOrder {
//   id: Hex
//   type: "twap"
//   baseTokenA: Address
//   quoteTokenA: Address
//   baseTokenAmount: number
//   marketPrice: number
//   value: number // baseTokenAmount * marketPrice
//   createdAt: number
//   endAt: number
//   priceProtection: number
//   numberOfParts: number
//   filled?: {
//     index: number
//     at: number
//     txHash: Hex
//     quoteTokenAmount: number
//   }[]
//   claimed?: {
//     at: number
//     txHash: Hex
//   }[]
//   cancelled?: {
//     at: number
//     txHash: Hex
//   }
// }
