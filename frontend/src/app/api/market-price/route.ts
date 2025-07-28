import { unstable_cache } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import axios from "axios"

import { chain } from "@/config/chain"

export async function GET(request: NextRequest) {
  const getMarketPrice = unstable_cache(
    async () => {
      const url = `https://api.1inch.dev/price/v1.1/${chain.id}?currency=USD`
      console.log("REQUESTING MARKET PRICE", url)
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`,
        },
      })
      return response.json()
    },
    ["market-price"],
    {
      tags: ["market-price"],
      revalidate: 5,
    }
  )

  const marketPrice = await getMarketPrice()

  return NextResponse.json(marketPrice)
}
