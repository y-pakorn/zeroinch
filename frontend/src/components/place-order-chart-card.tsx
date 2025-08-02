import { useEffect, useMemo, useRef } from "react"
import BigNumber from "bignumber.js"
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  Time,
} from "lightweight-charts"
import { Loader2 } from "lucide-react"
import { useFormContext } from "react-hook-form"
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
  const {
    type,
    baseTokenA,
    quoteTokenA,
    selectedInterval,
    diffPercentage,
    rate,
    isFixedRate,
    inversed,
  } = watch()

  const { data: candlestickPrice, isLoading: isLoadingCandlestickPrice } =
    useCandlestickPrice({
      base: baseTokenA,
      quote: quoteTokenA,
      interval: selectedInterval,
    })

  const { marketPrice, baseToken, quoteToken } = usePlaceOrder()

  // Calculate effective market price and diffed price
  const effectiveMarketPrice = useMemo(() => {
    return inversed ? marketPrice.pow(-1) : marketPrice
  }, [marketPrice, inversed])

  const diffedPrice = useMemo(() => {
    if (isFixedRate) {
      return new BigNumber(rate)
    }
    return effectiveMarketPrice.multipliedBy(diffPercentage + 1)
  }, [isFixedRate, rate, effectiveMarketPrice, diffPercentage])

  // Calculate chart prices inline - these are simple transformations
  const getChartPrice = (price: BigNumber) => (inversed ? price.pow(-1) : price)

  // TWAP limits - memoize since they're used in useEffect dependencies
  const twapLimitUpper = useMemo(
    () => effectiveMarketPrice.multipliedBy(diffPercentage + 1),
    [effectiveMarketPrice, diffPercentage]
  )
  const twapLimitLower = useMemo(
    () => effectiveMarketPrice.multipliedBy(1 - diffPercentage),
    [effectiveMarketPrice, diffPercentage]
  )

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<[IChartApi, ISeriesApi<"Candlestick">]>(null)

  useEffect(() => {
    if (!chartContainerRef.current || !candlestickPrice) return
    const chartContainer = chartContainerRef.current

    const handleResize = () => {
      chart.applyOptions({ width: chartContainer.clientWidth })
    }

    const chart = createChart(chartContainerRef.current!, {
      layout: {
        background: { color: "#FFFFFF00" },
        textColor: "#DDD",
        attributionLogo: false,
        fontFamily: "Geist",
      },
      grid: {
        vertLines: { color: "#44444455" },
        horzLines: { color: "#44444455" },
      },
      crosshair: {
        mode: CrosshairMode.MagnetOHLC,
      },
      width: chartContainer.clientWidth,
      height: 300,
    })
    chart.timeScale().fitContent()
    chart.timeScale().applyOptions({
      borderColor: "#44444455",
      barSpacing: 10,
      fixLeftEdge: true,
      fixRightEdge: true,
      timeVisible: true,
      secondsVisible: true,
    })

    const mainSeries = chart.addSeries(CandlestickSeries, {
      wickUpColor: "rgb(75, 175, 75)",
      upColor: "rgb(75, 175, 75)",
      wickDownColor: "rgb(225, 50, 85)",
      downColor: "rgb(225, 50, 85)",
      borderVisible: false,
      priceFormat: {
        minMove: 0.0000001,
        precision: 4,
      },
      priceLineVisible: false,
    })

    // Remove outlier wicks by capping high/low to within 2x the open-close range
    mainSeries.setData(
      candlestickPrice.map((item) => {
        const range = Math.abs(item.close - item.open)
        const maxRange = range * 3
        const midPrice = (item.close + item.open) / 2
        return {
          close: item.close,
          open: item.open,
          high: Math.min(item.high, midPrice + maxRange),
          low: Math.max(item.low, midPrice - maxRange),
          time: item.time as Time,
        }
      })
    )

    mainSeries.priceScale().applyOptions({
      autoScale: true,
      borderColor: "#44444455",
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
    })

    chartRef.current = [chart, mainSeries]

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.removeSeries(mainSeries)
      chart.remove()
    }
  }, [candlestickPrice])

  const priceRefLineRef = useRef<IPriceLine[]>([])
  useEffect(() => {
    if (!chartRef.current) return

    const [chart, series] = chartRef.current

    if (type === "limit" && diffPercentage !== 0) {
      priceRefLineRef.current.push(
        series.createPriceLine({
          price: getChartPrice(effectiveMarketPrice).toNumber(),
          title: "Market Price",
          color: "#6B8EFF",
          lineStyle: LineStyle.LargeDashed,
        })
      )
      priceRefLineRef.current.push(
        series.createPriceLine({
          price: getChartPrice(diffedPrice).toNumber(),
          title: "Limit Price",
          color: "#2962FF",
          lineStyle: LineStyle.Solid,
        })
      )
    } else {
      priceRefLineRef.current.push(
        series.createPriceLine({
          price: getChartPrice(effectiveMarketPrice).toNumber(),
          title: "Market Price",
          color: "#2962FF",
          lineStyle: LineStyle.Solid,
        })
      )
    }

    if (type === "twap") {
      priceRefLineRef.current.push(
        series.createPriceLine({
          price: getChartPrice(twapLimitUpper).toNumber(),
          title: "TWAP Upper Limit",
          color: "#2962FF",
          lineStyle: LineStyle.Solid,
        })
      )

      priceRefLineRef.current.push(
        series.createPriceLine({
          price: getChartPrice(twapLimitLower).toNumber(),
          title: "TWAP Lower Limit",
          color: "#2962FF",
          lineStyle: LineStyle.Solid,
        })
      )
    }

    return () => {
      priceRefLineRef.current.forEach((line) => {
        series.removePriceLine(line)
      })
      priceRefLineRef.current = []
    }
  }, [
    effectiveMarketPrice,
    chartRef,
    diffedPrice,
    twapLimitLower,
    twapLimitUpper,
    type,
    chartRef.current,
  ])

  return (
    <Card className="h-min w-full">
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
          {[
            {
              value: 300,
              label: "5m",
            },
            {
              value: 900,
              label: "15m",
            },
            {
              value: 3600,
              label: "1h",
            },
          ].map((interval) => (
            <ToggleGroupItem
              key={interval.value}
              value={interval.value.toString()}
              variant="outline"
            >
              {interval.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent className="relative h-fit">
        {isLoadingCandlestickPrice && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="stroke-muted-foreground size-6 animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}
