import { Loader2 } from "lucide-react"
import { useForm, useFormContext } from "react-hook-form"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { images } from "@/config/image"
import { formatter } from "@/lib/formatter"
import { PlaceOrderFormData } from "@/lib/schema"
import { useCandlestickPrice } from "@/hooks/use-candlestick-price"

import { usePlaceOrder } from "./place-order-provider"
import { Card, CardContent, CardHeader } from "./ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"

export default function PlaceOrderChartCard() {
  const { watch, setValue } = useFormContext<PlaceOrderFormData>()
  const { type, baseTokenA, quoteTokenA, selectedInterval, diffPercentage } =
    watch()

  const { data: candlestickPrice, isLoading: isLoadingCandlestickPrice } =
    useCandlestickPrice({
      base: baseTokenA,
      quote: quoteTokenA,
      interval: selectedInterval,
    })

  const { marketPrice, baseToken, quoteToken } = usePlaceOrder()

  const twapLimitUpper = marketPrice.multipliedBy(1 + diffPercentage)
  const twapLimitLower = marketPrice.multipliedBy(1 - diffPercentage)

  return (
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
            setValue("selectedInterval", parseInt(value) as 300 | 900 | 3600)
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
                (dataMin: number) =>
                  Math.min(
                    dataMin,
                    type === "limit" ? dataMin : twapLimitLower.toNumber()
                  ) * 0.995,
                (dataMax: number) =>
                  Math.max(dataMax, twapLimitUpper.toNumber()) * 1.01,
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
                  marketPrice.toNumber(),
                  formatter.decimals(marketPrice.toNumber())
                )}`,
                position: "insideTopLeft",
                offset: 5,
                fill: "var(--primary)",
              }}
            />

            {type === "twap" && (
              <ReferenceLine
                key="twap-price-upper"
                y={twapLimitUpper.toNumber()}
                stroke="white"
                label={{
                  value: `TWAP Upper Limit: ${formatter.value(
                    twapLimitUpper.toNumber(),
                    formatter.decimals(twapLimitUpper.toNumber())
                  )}`,
                  position: "insideBottomRight",
                  offset: 5,
                  fill: "var(--primary)",
                }}
              />
            )}
            {type === "twap" && (
              <ReferenceLine
                key="twap-price-lower"
                y={twapLimitLower.toNumber()}
                stroke="white"
                label={{
                  value: `TWAP Lower Limit: ${formatter.value(
                    twapLimitLower.toNumber(),
                    formatter.decimals(twapLimitLower.toNumber())
                  )}`,
                  position: "insideBottomRight",
                  offset: 5,
                  fill: "var(--primary)",
                }}
              />
            )}
            {type === "limit" && diffPercentage !== 0 && (
              <ReferenceLine
                key="limit-price"
                y={twapLimitUpper.toNumber()}
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
  )
}
