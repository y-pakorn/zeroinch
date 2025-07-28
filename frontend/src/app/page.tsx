"use client"

import { useState } from "react"
import { Address } from "viem"

import { useCandlestickPrice } from "@/hooks/use-candlestick-price"

export default function Home() {
  const [baseToken, setBaseToken] = useState<Address>(
    "0x4200000000000000000000000000000000000006"
  )
  const [quoteToken, setQuoteToken] = useState<Address>(
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
  )

  const { data: candlestickPrice } = useCandlestickPrice({
    base: baseToken,
    quote: quoteToken,
  })

  return (
    <main className="container">
      <h1>Good morning</h1>
    </main>
  )
}
