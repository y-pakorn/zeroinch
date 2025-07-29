import type { Address, Hex } from "viem"

export interface IAccount {
  seed: Hex
  notes: Note[]
  orders: IOrder[]
}

export interface Note {
  seed: Hex
}

export type IOrder = ILimitOrder | ITwapOrder

export interface IToken {
  address: Address
  chainId: number
  symbol: string
  name: string
  decimals: number
  logoURI: string | null
  providers: string[]
  eip2612: boolean
  isFoT: boolean
  tags: string[]
}

export interface ILimitOrder {
  id: Hex
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
  filled?: {
    at: number
    txHash: Hex
    actualQuoteTokenAmount: number
  }
  claimed?: {
    at: number
    txHash: Hex
  }
  cancelled?: {
    at: number
    txHash: Hex
  }
}

export interface ITwapOrder {
  id: Hex
  type: "twap"
  baseTokenA: Address
  quoteTokenA: Address
  baseTokenAmount: number
  marketPrice: number
  value: number // baseTokenAmount * marketPrice
  createdAt: number
  endAt: number
  priceProtection: number
  numberOfParts: number
  filled?: {
    index: number
    at: number
    txHash: Hex
    quoteTokenAmount: number
  }[]
  claimed?: {
    at: number
    txHash: Hex
  }[]
  cancelled?: {
    at: number
    txHash: Hex
  }
}
