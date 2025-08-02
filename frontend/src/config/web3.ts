import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { getConnections } from "@wagmi/core"
import { createPublicClient, http, parseAbi } from "viem"
import { cookieStorage, createStorage } from "wagmi"

import { env } from "@/env.mjs"

import { chain } from "./chain"

declare module "wagmi" {
  interface Register {
    config: typeof web3Config
  }
}

export const web3Config = getDefaultConfig({
  appName: "ZeroInch",
  projectId: env.NEXT_PUBLIC_PROJECT_ID,
  storage: createStorage({
    storage: cookieStorage,
  }),
  chains: [chain],
  ssr: true,
  batch: {
    multicall: {
      batchSize: 16_384,
      wait: 50,
    },
  },
})

export const connections = getConnections(web3Config)
