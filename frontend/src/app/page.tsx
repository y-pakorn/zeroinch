"use client"

import { useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import { NumericFormat } from "react-number-format"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import { Address } from "viem"

import { images } from "@/config/image"
import { tokens } from "@/config/token"
import { formatter } from "@/lib/formatter"
import { useCandlestickPrice } from "@/hooks/use-candlestick-price"
import { useMarketPrice } from "@/hooks/use-market-price"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TransparentInput } from "@/components/transparent-input"

export default function Home() {
  const [baseTokenA, setBaseTokenA] = useState<Address>(
    "0x4200000000000000000000000000000000000006"
  )
  const [baseTokenAmount, setBaseTokenAmount] = useState<number | undefined>()
  const baseToken = tokens[baseTokenA]!
  const [quoteTokenA, setQuoteTokenA] = useState<Address>(
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
  )
  const quoteToken = tokens[quoteTokenA]!

  const [selectedInterval, setSelectedInterval] = useState<300 | 900 | 3600>(
    900
  )

  const { data: candlestickPrice, isLoading: isLoadingCandlestickPrice } =
    useCandlestickPrice({
      base: baseTokenA,
      quote: quoteTokenA,
      interval: selectedInterval,
    })

  const { data: prices, isLoading: isLoadingPrices } = useMarketPrice({
    queryOptions: {
      refetchInterval: 5000, // 4 seconds
    },
  })

  return (
    <main className="container min-h-screen flex-col space-y-4 py-8">
      <div className="font-mono font-semibold">ZeroInch</div>
      <div className="flex flex-1 items-center justify-center gap-4">
        <Card className="w-full">
          <CardHeader className="flex items-center gap-2 rounded-xl">
            <img
              src={baseToken.logoURI || images.unknown}
              alt={baseToken.name}
              className="size-10 shrink-0"
            />
            <img
              src={quoteToken.logoURI || images.unknown}
              alt={quoteToken.name}
              className="-ml-4 size-10 shrink-0"
            />
            <div className="-space-y-1">
              <div className="text-xl font-semibold">
                {baseToken.symbol}/{quoteToken.symbol}
              </div>
              <div className="text-muted-foreground truncate text-sm">
                {baseToken.name} - {quoteToken.name}
              </div>
            </div>
            <div className="flex-1" />
            <ToggleGroup
              type="single"
              value={selectedInterval.toString()}
              onValueChange={(value) => {
                setSelectedInterval(parseInt(value) as 300 | 900 | 3600)
              }}
            >
              {[300, 900, 3600].map((interval) => (
                <ToggleGroupItem
                  key={interval}
                  value={interval.toString()}
                  variant="outline"
                >
                  {formatter.duration(interval, "s")}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardHeader>
          <CardContent className="relative">
            {isLoadingCandlestickPrice && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="stroke-muted-foreground size-6 animate-spin" />
              </div>
            )}
            <ChartContainer
              className="h-[300px] w-full"
              config={{
                close: {
                  label: "Price",
                  color: "var(--chart-1)",
                },
              }}
            >
              <AreaChart
                data={candlestickPrice}
                margin={{
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
              >
                <YAxis
                  dataKey="close"
                  hide
                  domain={[
                    (dataMin: number) => dataMin * 0.995,
                    (dataMax: number) => dataMax * 1.005,
                  ]}
                />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    return formatter.timeShort(value)
                  }}
                />
                <defs>
                  <linearGradient id="fillClose" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-close)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-close)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const time = payload?.[0]?.payload?.time
                        return `At ${formatter.timeShort(time)}`
                      }}
                      indicator="line"
                      valueFormatter={(value) => {
                        return `${formatter.valueLocale(value)} ${quoteToken.symbol}`
                      }}
                    />
                  }
                />
                <Area
                  dataKey="close"
                  type="natural"
                  fill="url(#fillClose)"
                  stroke="var(--color-close)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="w-[400px] shrink-0">
          <CardContent>
            <div className="text-muted-foreground text-sm">You are selling</div>
            <div className="flex items-center gap-2">
              <NumericFormat
                value={baseTokenAmount}
                customInput={TransparentInput}
                thousandSeparator
                className="h-10 w-full text-2xl! font-semibold"
                placeholder="0.0"
                onValueChange={(value) => {
                  setBaseTokenAmount(value.floatValue)
                }}
              />
              <Button variant="outline" size="sm">
                <img
                  src={baseToken.logoURI || images.unknown}
                  alt={baseToken.name}
                  className="size-4"
                />
                <div className="font-semibold">{baseToken.symbol}</div>
                <ChevronDown />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {baseTokenAmount && (
                <div className="text-muted-foreground truncate text-xs">
                  ≈{" "}
                  {formatter.usd((prices?.[baseTokenA] || 0) * baseTokenAmount)}
                </div>
              )}
              <div className="flex-1" />
              <div className="text-muted-foreground text-sm">
                Balance: {formatter.valueLocale(1000000)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
