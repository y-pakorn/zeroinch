import { defineChain } from "viem"
import { optimism } from "viem/chains"

export const chain = defineChain({
  ...optimism,
})
