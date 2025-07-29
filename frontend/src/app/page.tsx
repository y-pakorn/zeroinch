"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import BigNumber from "bignumber.js"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  Wallet,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import { Address } from "viem"
import { z } from "zod"

import { images } from "@/config/image"
import { tokens } from "@/config/token"
import { formatter } from "@/lib/formatter"
import { useCandlestickPrice } from "@/hooks/use-candlestick-price"
import { useMarketPrice } from "@/hooks/use-market-price"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SelectTokenDialog } from "@/components/select-token-dialog"
import { TransparentInput } from "@/components/transparent-input"

// Zod schema for form validation
const formSchema = z.object({
  baseTokenA: z.custom<Address>(
    (val) => typeof val === "string" && /^0x[a-fA-F0-9]{40}$/.test(val),
    { message: "Invalid Ethereum address" }
  ),
  baseTokenAmount: z.number().min(0, "Amount must be positive"),
  quoteTokenA: z.custom<Address>(
    (val) => typeof val === "string" && /^0x[a-fA-F0-9]{40}$/.test(val),
    { message: "Invalid Ethereum address" }
  ),
  quoteTokenAmount: z.number().min(0, "Amount must be positive"),
  selectedInterval: z.union([z.literal(300), z.literal(900), z.literal(3600)]),
  diffPercentage: z.number(),
  inversed: z.boolean(),
  expiry: z.number().positive("Expiry must be positive"),
})

type FormData = z.infer<typeof formSchema>

export default function Home() {
  // Form setup with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseTokenA: "0x4200000000000000000000000000000000000006" as Address,
      baseTokenAmount: 0,
      quoteTokenA: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as Address,
      quoteTokenAmount: 0,
      selectedInterval: 900,
      diffPercentage: 0,
      inversed: false,
      expiry: 24,
    },
  })

  const {
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form

  // Watch form values for reactive calculations
  const {
    baseTokenA,
    baseTokenAmount,
    quoteTokenA,
    quoteTokenAmount,
    selectedInterval,
    diffPercentage,
    inversed,
    expiry,
  } = watch()

  // UI state (keeping as useState since they're not part of form data)
  const [selectBaseTokenDialogOpen, setSelectBaseTokenDialogOpen] =
    useState(false)
  const [selectQuoteTokenDialogOpen, setSelectQuoteTokenDialogOpen] =
    useState(false)

  // Get token objects
  const baseToken = tokens[baseTokenA]!
  const quoteToken = tokens[quoteTokenA]!

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

  const marketPrice = useMemo(
    () =>
      new BigNumber(prices?.[baseTokenA] || 0).div(prices?.[quoteTokenA] || 1),
    [prices, baseTokenA, quoteTokenA]
  )

  // Calculate diffed prices
  const diffedPriceBase = marketPrice.multipliedBy(1 + diffPercentage)
  const diffedPrice = !inversed
    ? marketPrice.multipliedBy(1 + diffPercentage)
    : marketPrice.pow(-1).multipliedBy(1 + diffPercentage)

  // Handle interdependent calculations
  useEffect(() => {
    // When diffPercentage changes, recalculate base token amount
    if (quoteTokenAmount > 0) {
      const newPrice = marketPrice.multipliedBy(1 + diffPercentage)
      const newBaseTokenAmount = newPrice.pow(-1).multipliedBy(quoteTokenAmount)
      setValue("baseTokenAmount", newBaseTokenAmount.toNumber())
    }
  }, [diffPercentage])

  useEffect(() => {
    if (baseTokenAmount > 0) {
      const newPrice = marketPrice.multipliedBy(1 + diffPercentage)
      const newQuoteTokenAmount = newPrice.multipliedBy(baseTokenAmount)
      setValue("quoteTokenAmount", newQuoteTokenAmount.toNumber())
    }
  }, [prices])

  // Helper function to handle amount changes
  const handleBaseAmountChange = (
    value: number | undefined,
    source: string
  ) => {
    if (value && source === "event") {
      setValue("baseTokenAmount", value || 0)
      const quoteAmount = diffedPrice.multipliedBy(value).toNumber()
      setValue("quoteTokenAmount", quoteAmount)
    }
    if (value === undefined) {
      setValue("quoteTokenAmount", 0)
    }
  }

  const handleQuoteAmountChange = (
    value: number | undefined,
    source: string
  ) => {
    if (value && source === "event") {
      setValue("quoteTokenAmount", value || 0)
      const baseAmount = diffedPrice.pow(-1).multipliedBy(value).toNumber()
      setValue("baseTokenAmount", baseAmount)
    }
    if (value === undefined) {
      setValue("baseTokenAmount", 0)
    }
  }

  // Helper function to handle token swapping
  const handleTokenSwap = () => {
    const currentValues = getValues()
    setValue("baseTokenA", currentValues.quoteTokenA)
    setValue("quoteTokenA", currentValues.baseTokenA)
    setValue("baseTokenAmount", currentValues.quoteTokenAmount)
    setValue("quoteTokenAmount", currentValues.baseTokenAmount)
  }

  // Helper function to handle price input changes
  const handlePriceChange = (value: number | undefined, source: string) => {
    if (source === "event") {
      if (!value) {
        setValue("diffPercentage", 0)
        return
      }

      // Calculate the percentage difference from market price
      const price = !inversed ? marketPrice : marketPrice.pow(-1)
      const newPercentage = new BigNumber(value)
        .minus(price)
        .div(price)
        .toNumber()

      setValue("diffPercentage", newPercentage)
    }
  }

  const baseTokenValue = useMemo(() => {
    return (prices?.[baseTokenA] || 0) * baseTokenAmount
  }, [baseTokenA, baseTokenAmount, prices])

  return (
    <main
      className="container min-h-screen flex-col space-y-4 py-8"
      style={
        {
          "--main-width": "400px",
        } as React.CSSProperties
      }
    >
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
                setValue(
                  "selectedInterval",
                  parseInt(value) as 300 | 900 | 3600
                )
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
                  domain={[
                    (dataMin: number) => dataMin * 0.995,
                    (dataMax: number) =>
                      Math.max(dataMax, diffedPriceBase.toNumber()) * 1.01,
                  ]}
                  tickFormatter={(value) => {
                    return formatter.value(value, formatter.decimals(value))
                  }}
                  axisLine={false}
                  tickCount={8}
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

                <ReferenceLine
                  key="market-price"
                  y={marketPrice.toNumber()}
                  stroke="var(--primary)"
                  strokeDasharray="3 3"
                  strokeOpacity={diffPercentage === 0 ? 1 : 0.5}
                  label={{
                    opacity: diffPercentage === 0 ? 1 : 0.5,
                    value: `Market Price: ${formatter.value(
                      diffedPriceBase.toNumber(),
                      formatter.decimals(diffedPriceBase.toNumber())
                    )}`,
                    position: "insideTopLeft",
                    offset: 5,
                    fill: "var(--primary)",
                  }}
                />
                {diffPercentage !== 0 && (
                  <ReferenceLine
                    key="limit-price"
                    y={diffedPriceBase.toNumber()}
                    stroke="var(--primary)"
                    label={{
                      value: "Limit Price",
                      position: "insideBottomRight",
                      offset: 5,
                      fill: "var(--primary)",
                    }}
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="w-[var(--main-width)] shrink-0 space-y-2">
          <div className="text-2xl font-semibold">
            <span>Limit Order</span>
            <span className="text-muted-foreground/80">/TWAP</span>
          </div>
          <Card className="relative">
            <Button
              className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-[calc(50%+0.25rem)]"
              size="iconXs"
              variant="default"
              onClick={handleTokenSwap}
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
                    setValue("baseTokenA", token.address)
                    // recalculate base token amount based on the new token
                    setValue(
                      "baseTokenAmount",
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
                    handleBaseAmountChange(value.floatValue, source)
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
                {!!baseTokenValue && (
                  <div className="text-muted-foreground truncate text-xs">
                    ≈{" "}
                    {formatter.usd(
                      baseTokenValue,
                      formatter.decimals(baseTokenValue)
                    )}
                  </div>
                )}
                <div className="flex-1" />
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Wallet className="size-3" />
                  {formatter.valueLocale(1000000)}
                  <Button
                    variant="outline"
                    size="2xs"
                    onClick={() => {
                      const balance = 500000
                      setValue("baseTokenAmount", balance)
                      const quoteTokenAmount = diffedPrice
                        .multipliedBy(balance)
                        .toNumber()
                      setValue("quoteTokenAmount", quoteTokenAmount)
                    }}
                  >
                    Half
                  </Button>
                  <Button
                    variant="outline"
                    size="2xs"
                    onClick={() => {
                      const balance = 1000000
                      setValue("baseTokenAmount", balance)
                      const quoteTokenAmount = diffedPrice
                        .multipliedBy(balance)
                        .toNumber()
                      setValue("quoteTokenAmount", quoteTokenAmount)
                    }}
                  >
                    Max
                  </Button>
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
                    setValue("quoteTokenA", token.address)
                    // recalculate quote token amount based on the new token
                    setValue(
                      "quoteTokenAmount",
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
                    handleQuoteAmountChange(value.floatValue, source)
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
                <div className="flex-1" />
                <div>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Wallet className="size-3" />
                    {formatter.valueLocale(1000000)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-muted-foreground inline-flex items-center gap-1 text-sm">
                When 1 {!inversed ? baseToken.symbol : quoteToken.symbol} is
                worth{" "}
                <Button
                  variant="ghost"
                  size="iconXs"
                  onClick={() => setValue("inversed", !inversed)}
                >
                  <ArrowUpDown />
                </Button>
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
                    handlePriceChange(value.floatValue, source)
                  }}
                  decimalScale={
                    !inversed ? quoteToken.decimals : baseToken.decimals
                  }
                />
                <img
                  src={
                    !inversed
                      ? quoteToken.logoURI || images.unknown
                      : baseToken.logoURI || images.unknown
                  }
                  alt={!inversed ? quoteToken.name : baseToken.name}
                  className="size-4 rounded-full"
                />
                <div className="font-semibold">
                  {!inversed ? quoteToken.symbol : baseToken.symbol}
                </div>
              </div>
              <div className="mt-1 flex items-center gap-2">
                {[
                  {
                    show: ![0, 0.005, 0.01, 0.05, 0.1].includes(diffPercentage),
                    label: formatter.percentage(
                      diffPercentage,
                      formatter.decimalsTight(diffPercentage)
                    ),
                    value: diffPercentage,
                  },
                  {
                    label: "Market",
                    value: 0,
                  },
                  {
                    label: `${!inversed ? "+0.5%" : "-0.5%"}`,
                    value: 0.005,
                  },
                  {
                    label: `${!inversed ? "+1%" : "-1%"}`,
                    value: 0.01,
                  },
                  {
                    label: `${!inversed ? "+5%" : "-5%"}`,
                    value: 0.05,
                  },
                  {
                    label: `${!inversed ? "+10%" : "-10%"}`,
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
                        setValue("diffPercentage", item.value)
                      }}
                    >
                      {item.label}
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 space-y-1">
              <div className="text-muted-foreground text-sm">Expiry</div>
              <div className="flex-1" />
              {[
                {
                  label: "1 hour",
                  value: 1,
                },
                {
                  label: "12 hours",
                  value: 12,
                },
                {
                  label: "1 day",
                  value: 24,
                },
                {
                  label: "1 week",
                  value: 168,
                },
              ].map((item) => (
                <Button
                  key={item.label}
                  variant={expiry === item.value ? "default" : "outline"}
                  size="xs"
                  onClick={() => setValue("expiry", item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </CardContent>
          </Card>
          <Button className="w-full" size="lg">
            Submit Order
          </Button>
        </div>
      </div>
    </main>
  )
}
