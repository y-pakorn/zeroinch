import type { Hex } from "viem"

export interface IAccount {
  seed: Hex
  notes: Note[]
}

export interface Note {
  seed: Hex
}

export interface IToken {
  address: Hex
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
