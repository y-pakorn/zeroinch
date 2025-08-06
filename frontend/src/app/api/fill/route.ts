import { NextRequest, NextResponse } from "next/server"
import {
  Extension,
  LimitOrder,
  LimitOrderV4Struct,
  MakerTraits,
  Address as OneInchAddress,
  TakerTraits,
} from "@1inch/limit-order-sdk"
import {
  Address,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  Hex,
  http,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { env } from "@/env.mjs"
import { chain } from "@/config/chain"
import { contracts } from "@/config/contract"
import { tokens, USDC, USDT } from "@/config/token"

const UINT_MAX =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n

export async function POST(req: NextRequest) {
  try {
    const { data, extension } = (await req.json()) as {
      data: LimitOrderV4Struct
      extension: string
    }

    const order = LimitOrder.fromDataAndExtension(
      data,
      Extension.decode(extension)
    )

    const walletClient = createWalletClient({
      chain,
      transport: http(env.RELAYER_RPC_URL),
      account: privateKeyToAccount(env.RELAYER_PRIVATE_KEY as Address),
    })

    const client = createPublicClient({
      chain,
      transport: http(env.RELAYER_RPC_URL),
    })

    if (![USDC, USDT].includes(order.makerAsset.toString())) {
      return NextResponse.json({
        noRetry: true,
        message: "Only support USDC and USDT as maker asset",
      })
    }

    if (![USDC, USDT].includes(order.takerAsset.toString())) {
      return NextResponse.json({
        noRetry: true,
        message: "Only support USDC and USDT as taker asset",
      })
    }

    if (order.takingAmount > 100000n || order.makingAmount > 100000n) {
      return NextResponse.json({
        noRetry: true,
        message: "Amount too large, max 1 USDC or USDT",
      })
    }

    const quoteResult = await client.readContract({
      address: contracts.quoter.address,
      abi: contracts.quoter.abi,
      functionName: "quoteExactInputSingle",
      args: [
        order.makerAsset.toString() as Hex,
        order.takerAsset.toString() as Hex,
        100,
        order.makingAmount,
        0n,
      ],
    })

    if ((quoteResult * 102n) / 100n < order.takingAmount) {
      return NextResponse.json({
        noRetry: false,
        message: "Quote +2% is less than taking amount",
      })
    }

    const takerTraits = TakerTraits.default()
      .disablePermit2()
      .setExtension(order.extension)
      .encode()

    const tx = await walletClient.sendTransaction({
      to: contracts.limit.address,
      data: encodeFunctionData({
        abi: contracts.limit.abi,
        functionName: "fillContractOrderArgs",
        args: [
          {
            maker: order.maker.toBigint(),
            receiver: order.receiver.toBigint(),
            makerAsset: order.makerAsset.toBigint(),
            takerAsset: order.takerAsset.toBigint(),
            makingAmount: order.makingAmount,
            takingAmount: order.takingAmount,
            makerTraits: order.makerTraits.asBigInt(),
            salt: order.salt,
          },
          "0x00",
          order.takingAmount,
          takerTraits.trait,
          takerTraits.args as Hex,
        ],
      }),
    })

    return NextResponse.json({
      tx,
    })
  } catch (error) {
    return NextResponse.json({
      message: `Failed to fill order: ${error}`,
    })
  }
}
