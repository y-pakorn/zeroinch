import { NextRequest, NextResponse } from "next/server"
import { Address, createPublicClient, createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { env } from "@/env.mjs"
import { chain } from "@/config/chain"
import { contracts } from "@/config/contract"

export async function POST(req: NextRequest) {
  const { txData } = await req.json()

  const walletClient = createWalletClient({
    chain,
    transport: http(env.RELAYER_RPC_URL),
    account: privateKeyToAccount(env.RELAYER_PRIVATE_KEY as Address),
  })

  const client = createPublicClient({
    chain,
    transport: http(env.RELAYER_RPC_URL),
  })

  try {
    const tx = await walletClient.sendTransaction({
      to: contracts.zeroinch.address,
      data: txData,
      value: 0n,
      gasPrice: 10000000n, // 0.01 gwei
    })
    return NextResponse.json({ tx })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      {
        error: "Failed to relay transaction",
        message: error.shortMessage || error.details || error.message,
      },
      { status: 500 }
    )
  }
}
