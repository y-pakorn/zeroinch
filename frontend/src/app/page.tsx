"use client"

import { useEffect, useState } from "react"
import BigNumber from "bignumber.js"
import { ArrowDown, ChevronDown, Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"
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
import { SelectTokenDialog } from "@/components/select-token-dialog"
import { TransparentInput } from "@/components/transparent-input"

export default function Home() {
  const [baseTokenA, setBaseTokenA] = useState<Address>(
    "0x4200000000000000000000000000000000000006"
  )
  const [baseTokenAmount, setBaseTokenAmount] = useState<number>(0)
  const baseToken = tokens[baseTokenA]!

  const [quoteTokenA, setQuoteTokenA] = useState<Address>(
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
  )
  const [quoteTokenAmount, setQuoteTokenAmount] = useState<number>(0)
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

  const [selectBaseTokenDialogOpen, setSelectBaseTokenDialogOpen] =
    useState(false)
  const [selectQuoteTokenDialogOpen, setSelectQuoteTokenDialogOpen] =
    useState(false)

  const marketPrice = new BigNumber(prices?.[baseTokenA] || 0).div(
    prices?.[quoteTokenA] || 1
  )

  // -1 to infinity, 0 is the market price, 1 is 100% higher, -1 is 100% lower
  const [diffPercentage, setDiffPercentage] = useState(0)
  const diffedPrice = marketPrice.multipliedBy(1 + diffPercentage)

  return (
    <main className="container min-h-screen flex-col space-y-4 py-8">
      <div className="font-mono font-semibold">ZeroInch</div>
      <div className="flex flex-1 items-center justify-center gap-4">
        <Card className="w-full">
          <CardHeader className="flex items-center gap-2 rounded-xl">
            <img
              src={baseToken.logoURI || images.unknown}
              alt={baseToken.name}
              className="size-10 shrink-0 rounded-full"
            />
            <img
              src={quoteToken.logoURI || images.unknown}
              alt={quoteToken.name}
              className="-ml-4 size-10 shrink-0 rounded-full"
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
                        return `${formatter.value(value, formatter.decimals(value))} ${quoteToken.symbol}`
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
        <div className="w-[400px] shrink-0 space-y-2">
          <Card className="relative">
            <Button
              className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-[calc(50%+0.25rem)]"
              size="icon"
              variant="secondary"
              onClick={() => {
                const temp = baseTokenA
                const tempAmount = baseTokenAmount
                setBaseTokenA(quoteTokenA)
                setQuoteTokenA(temp)
                setBaseTokenAmount(quoteTokenAmount)
                setQuoteTokenAmount(tempAmount)
              }}
            >
              <ArrowDown />
            </Button>
            <CardContent>
              <div className="text-muted-foreground text-sm">
                You are selling
              </div>
              <div className="flex items-center gap-2">
                <SelectTokenDialog
                  open={selectBaseTokenDialogOpen}
                  onOpenChange={setSelectBaseTokenDialogOpen}
                  excludeTokens={[baseTokenA, quoteTokenA]}
                  onSelect={(token) => {
                    setBaseTokenA(token.address)
                    // recalculate base token amount based on the new token
                    setBaseTokenAmount(
                      (baseTokenAmount * (prices?.[baseTokenA] || 0)) /
                        (prices?.[token.address] || 0)
                    )
                  }}
                />
                <NumericFormat
                  value={baseTokenAmount}
                  customInput={TransparentInput}
                  thousandSeparator
                  className="h-10 w-full text-3xl! font-semibold tracking-[-0.05em]"
                  placeholder="0.0"
                  allowNegative={false}
                  onValueChange={(value, { source }) => {
                    setBaseTokenAmount(value.floatValue || 0)
                    if (value.floatValue && source === "event") {
                      const quoteTokenAmount = marketPrice
                        .multipliedBy(value.floatValue)
                        .toNumber()
                      setQuoteTokenAmount(quoteTokenAmount)
                    }

                    if (value.floatValue === undefined) {
                      setQuoteTokenAmount(0)
                    }
                  }}
                  decimalScale={baseToken.decimals}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectBaseTokenDialogOpen(true)}
                >
                  <img
                    src={baseToken.logoURI || images.unknown}
                    alt={baseToken.name}
                    className="size-4 rounded-full"
                  />
                  <div className="font-semibold">{baseToken.symbol}</div>
                  <ChevronDown />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {!!baseTokenAmount && (
                  <div className="text-muted-foreground truncate text-xs">
                    ≈{" "}
                    {formatter.usd(
                      (prices?.[baseTokenA] || 0) * baseTokenAmount
                    )}
                  </div>
                )}
                <div className="flex-1" />
                <div
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    setBaseTokenAmount(1000000)
                  }}
                >
                  Balance: {formatter.valueLocale(1000000)}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-muted-foreground text-sm">
                And will receive
              </div>
              <div className="flex items-center gap-2">
                <SelectTokenDialog
                  open={selectQuoteTokenDialogOpen}
                  onOpenChange={setSelectQuoteTokenDialogOpen}
                  excludeTokens={[quoteTokenA, baseTokenA]}
                  onSelect={(token) => {
                    setQuoteTokenA(token.address)
                    // recalculate quote token amount based on the new token
                    setQuoteTokenAmount(
                      (baseTokenAmount * (prices?.[baseTokenA] || 0)) /
                        (prices?.[token.address] || 0)
                    )
                  }}
                />
                <NumericFormat
                  value={quoteTokenAmount}
                  customInput={TransparentInput}
                  thousandSeparator
                  className="h-10 w-full text-3xl! font-semibold tracking-[-0.05em]"
                  placeholder="0.0"
                  allowNegative={false}
                  onValueChange={(value, { source }) => {
                    setQuoteTokenAmount(value.floatValue || 0)
                    if (value.floatValue && source === "event") {
                      const baseTokenAmount = marketPrice
                        .pow(-1)
                        .multipliedBy(value.floatValue)
                        .toNumber()
                      setBaseTokenAmount(baseTokenAmount)
                    }

                    if (value.floatValue === undefined) {
                      setBaseTokenAmount(0)
                    }
                  }}
                  decimalScale={quoteToken.decimals}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectQuoteTokenDialogOpen(true)}
                >
                  <img
                    src={quoteToken.logoURI || images.unknown}
                    alt={quoteToken.name}
                    className="size-4 rounded-full"
                  />
                  <div className="font-semibold">{quoteToken.symbol}</div>
                  <ChevronDown />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {!!quoteTokenAmount && (
                  <div className="text-muted-foreground truncate text-xs">
                    ≈{" "}
                    {formatter.usd(
                      (prices?.[quoteTokenA] || 0) * quoteTokenAmount
                    )}
                  </div>
                )}
                <div className="flex-1" />
                <div
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    setQuoteTokenAmount(1000000)
                  }}
                >
                  Balance: {formatter.valueLocale(1000000)}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-muted-foreground text-sm">
                When 1 {baseToken.symbol} is worth
              </div>
              <div className="flex items-center gap-2">
                <NumericFormat
                  value={diffedPrice.toNumber()}
                  customInput={TransparentInput}
                  thousandSeparator
                  className="h-10 w-full text-3xl! font-semibold tracking-[-0.05em]"
                  placeholder="0.0"
                  allowNegative={false}
                  onValueChange={(value, { source }) => {
                    if (source === "event") {
                      if (!value.floatValue) {
                        setDiffPercentage(0)
                        return
                      }

                      // value is the real price, we need to calculate the percentage
                      const newPercentage = new BigNumber(value.floatValue)
                        .minus(marketPrice)
                        .div(marketPrice)
                        .toNumber()

                      setDiffPercentage(newPercentage)
                    }
                  }}
                  decimalScale={Math.min(
                    baseToken.decimals,
                    quoteToken.decimals
                  )}
                />
                <img
                  src={quoteToken.logoURI || images.unknown}
                  alt={quoteToken.name}
                  className="size-4 rounded-full"
                />
                <div className="font-semibold">{quoteToken.symbol}</div>
              </div>
              <div className="flex items-center gap-2">
                {[
                  {
                    show: ![0, 0.01, 0.05, 0.1].includes(diffPercentage),
                    label: `${diffPercentage > 0 ? "+" : ""}${(diffPercentage * 100).toFixed(2)}%`,
                    value: diffPercentage,
                  },
                  {
                    label: "Market",
                    value: 0,
                  },
                  {
                    label: "+1%",
                    value: 0.01,
                  },
                  {
                    label: "+5%",
                    value: 0.05,
                  },
                  {
                    label: "+10%",
                    value: 0.1,
                  },
                ].map((item) =>
                  item.show !== undefined && !item.show ? null : (
                    <Button
                      key={item.label}
                      variant={
                        item.show || diffPercentage === item.value
                          ? "default"
                          : "outline"
                      }
                      size="xs"
                      onClick={() => {
                        if (item.show) return
                        setDiffPercentage(item.value)
                      }}
                    >
                      {item.label}
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
