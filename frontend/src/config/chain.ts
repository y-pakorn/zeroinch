import { defineChain } from "viem"
import { arbitrum } from "viem/chains"

export const chain = defineChain({
  ...arbitrum,
  rpcUrls: {
    default: {
      http: ["https://arb1.lava.build"],
    },
  },
})
