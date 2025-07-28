"use client"

import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { base } from "viem/chains"
import { cookieToInitialState, State, WagmiProvider } from "wagmi"

import { web3Config } from "@/config/web3"

const queryClient = new QueryClient()

export function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode
  initialState?: State
}) {
  return (
    <WagmiProvider config={web3Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={base} theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
