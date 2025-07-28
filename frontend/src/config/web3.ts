import "@rainbow-me/rainbowkit/styles.css"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { base } from "viem/chains"
import { cookieStorage, createStorage } from "wagmi"

import { env } from "@/env.mjs"

export const web3Config = getDefaultConfig({
  appName: "ZeroInch",
  projectId: env.NEXT_PUBLIC_PROJECT_ID,
  storage: createStorage({
    storage: cookieStorage,
  }),
  chains: [base],
  ssr: true,
})
