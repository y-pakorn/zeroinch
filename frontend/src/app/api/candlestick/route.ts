import { unstable_cache } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

import { env } from "@/env.mjs"
import { chain } from "@/config/chain"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const base = searchParams.get("base")
  const quote = searchParams.get("quote")
  const interval = searchParams.get("interval")

  if (!base || !quote) {
    return NextResponse.json(
      { error: "Missing base or quote" },
      { status: 400 }
    )
  }

  if (!interval) {
    return NextResponse.json({ error: "Missing interval" }, { status: 400 })
  }

  if (!["300", "900", "3600"].includes(interval)) {
    return NextResponse.json(
      { error: "Invalid interval, must be 300, 900, or 3600" },
      { status: 400 }
    )
  }

  const getCandlestickPrice = unstable_cache(
    async () => {
      const url = `https://api.1inch.dev/charts/v1.0/chart/aggregated/candle/${base}/${quote}/${interval}/${chain.id}`
      console.log("REQUESTING CANDLESTICK PRICE", url)
      const data = await fetch(url, {
        headers: {
          Authorization: `Bearer ${env.ONEINCH_API_KEY}`,
        },
      })
        .then((res) => res.json())
        .then((data) => data.data)
      return data
    },
    ["candlestick-price", `${base}`, `${quote}`, `${interval}`, `${chain.id}`],
    {
      tags: ["candlestick-price"],
      revalidate: 60,
    }
  )

  const data = await getCandlestickPrice()

  return NextResponse.json(data)
}
