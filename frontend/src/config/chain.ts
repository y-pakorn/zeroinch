import { createPublicClient, defineChain, http } from "viem"
import { optimism } from "viem/chains"

export const chain = defineChain({
  ...optimism,
  name: "optimism",
})

export const client = createPublicClient({
  chain: chain,
  transport: http(),
  batch: {
    multicall: {
      batchSize: 16_384,
      wait: 50,
    },
  },
})

export const explorer = chain.blockExplorers.default.url
