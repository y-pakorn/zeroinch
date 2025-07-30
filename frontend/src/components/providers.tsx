"use client"

import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { State, WagmiProvider } from "wagmi"

import { chain } from "@/config/chain"
import { web3Config } from "@/config/web3"
import { createIDBPersister } from "@/lib/persister"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  },
})

const persister = createIDBPersister()

export function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode
  initialState?: State
}) {
  return (
    <WagmiProvider config={web3Config} initialState={initialState}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <RainbowKitProvider initialChain={chain} theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </PersistQueryClientProvider>
    </WagmiProvider>
  )
}
