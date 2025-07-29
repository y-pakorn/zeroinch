import { useEffect, useMemo, useState } from "react"
import BigNumber from "bignumber.js"
import {
  ArrowDown,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { NumericFormat } from "react-number-format"

import { images } from "@/config/image"
import { formatter } from "@/lib/formatter"
import { PlaceOrderFormData } from "@/lib/schema"
import { cn } from "@/lib/utils"

import { usePlaceOrder } from "./place-order-provider"
import { SelectTokenDialog } from "./select-token-dialog"
import { TransparentInput } from "./transparent-input"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

export default function PlaceOrderCard() {
  const { setValue, getValues, watch, ...form } =
    useFormContext<PlaceOrderFormData>()
  const {
    baseTokenA,
    baseTokenAmount,
    quoteTokenA,
    quoteTokenAmount,
    diffPercentage,
    inversed,
    expiry,
    numberOfParts,
    type,
  } = watch()

  const { marketPrice, baseToken, quoteToken, prices, submit, handleSubmit } =
    usePlaceOrder()

  // UI state (keeping as useState since they're not part of form data)
  const [selectBaseTokenDialogOpen, setSelectBaseTokenDialogOpen] =
    useState(false)
  const [selectQuoteTokenDialogOpen, setSelectQuoteTokenDialogOpen] =
    useState(false)

  // Calculate diffed prices
  const diffedPrice = !inversed
    ? marketPrice.multipliedBy(1 + diffPercentage)
    : marketPrice.pow(-1).multipliedBy(1 + diffPercentage)

  // Handle interdependent calculations
  useEffect(() => {
    // When diffPercentage changes, recalculate quote token amount
    if (type === "limit" && quoteTokenAmount > 0) {
      const newPrice = marketPrice.multipliedBy(1 + diffPercentage)
      const newQuoteTokenAmount = newPrice.multipliedBy(baseTokenAmount)
      setValue("quoteTokenAmount", newQuoteTokenAmount.toNumber())
    }

    if (type === "twap" && quoteTokenAmount > 0) {
      const newQuoteTokenAmount = marketPrice.multipliedBy(baseTokenAmount)
      setValue("quoteTokenAmount", newQuoteTokenAmount.toNumber())
    }
  }, [diffPercentage, marketPrice])

  // Helper function to handle amount changes
  const handleBaseAmountChange = (
    value: number | undefined,
    source: string
  ) => {
    if (value && source === "event") {
      const quoteAmount = diffedPrice.multipliedBy(value).toNumber()
      setValue("baseTokenAmount", value || 0, {
        shouldValidate: true,
      })
      setValue("quoteTokenAmount", quoteAmount, {
        shouldValidate: true,
      })
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
      const baseAmount = diffedPrice.pow(-1).multipliedBy(value).toNumber()
      setValue("quoteTokenAmount", value || 0)
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

  const setType = (type: "limit" | "twap") => {
    setValue("type", type)

    if (type === "twap") {
      setValue("numberOfParts", 2)
      setValue("diffPercentage", 0.01)
      setValue("expiry", 1)
    }

    if (type === "limit") {
      setValue("diffPercentage", 0)
      setValue("expiry", 24)
    }
  }

  return (
    <form
      className="w-[var(--main-width)] shrink-0 space-y-2"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <div className="text-muted-foreground/80 text-2xl font-semibold">
        <span
          className={cn(
            type === "limit" && "text-foreground",
            "cursor-pointer"
          )}
          onClick={() => setType("limit")}
        >
          Limit Order
        </span>
        /
        <span
          className={cn(type === "twap" && "text-foreground", "cursor-pointer")}
          onClick={() => setType("twap")}
        >
          TWAP
        </span>
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
          <div className="text-muted-foreground text-sm">You are selling</div>
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
                form.trigger("baseTokenAmount")
                form.trigger("quoteTokenAmount")
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
            And will receive {type === "twap" ? "around" : ""}
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
              disabled={type === "twap"}
              className="h-10 w-full text-3xl! font-semibold tracking-[-0.05em]"
              placeholder="0.0"
              allowNegative={false}
              onValueChange={(value, { source }) => {
                handleQuoteAmountChange(value.floatValue, source)
                form.trigger("baseTokenAmount")
                form.trigger("quoteTokenAmount")
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
      {type === "limit" && (
        <>
          <Card>
            <CardContent>
              <div className="text-muted-foreground inline-flex w-full items-center gap-1 text-sm">
                When 1{" "}
                <img
                  src={
                    !inversed
                      ? baseToken.logoURI || images.unknown
                      : quoteToken.logoURI || images.unknown
                  }
                  alt={!inversed ? baseToken.name : quoteToken.name}
                  className="size-3.5 rounded-full"
                />{" "}
                {!inversed ? baseToken.symbol : quoteToken.symbol} is worth{" "}
                <Button
                  variant="ghost"
                  size="iconXs"
                  className="ml-auto"
                  onClick={() => setValue("inversed", !inversed)}
                >
                  <ArrowLeftRight />
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
        </>
      )}
      {type === "twap" && (
        <>
          <Card>
            <CardContent className="flex items-center gap-2 space-y-1 *:mb-0">
              <div className="text-muted-foreground shrink-0 text-sm">
                Price Protection
              </div>
              <div className="flex-1" />
              {[
                {
                  label: "0.5%",
                  value: 0.005,
                },
                {
                  label: "1%",
                  value: 0.01,
                },
                {
                  label: "5%",
                  value: 0.05,
                },
                {
                  label: "10%",
                  value: 0.1,
                },
              ].map((item) => (
                <Button
                  key={item.label}
                  variant={
                    diffPercentage === item.value ? "default" : "outline"
                  }
                  size="xs"
                  onClick={() => setValue("diffPercentage", item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 space-y-1 *:mb-0">
              <div className="text-muted-foreground text-sm">Time</div>
              <div className="flex-1" />
              {[
                {
                  label: "1 hour",
                  value: 1,
                },
                {
                  label: "6 hours",
                  value: 6,
                },
                {
                  label: "12 hours",
                  value: 12,
                },
                {
                  label: "1 day",
                  value: 24,
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
          <Card>
            <CardContent className="flex items-center gap-2 space-y-1 *:mb-0">
              <div className="text-muted-foreground shrink-0 text-sm">
                Number of Parts
              </div>
              <div className="flex-1" />
              <div className="mb-0 text-3xl! font-semibold tracking-[-0.05em]">
                {formatter.value(numberOfParts)}
              </div>
              <Button
                variant="outline"
                size="iconXs"
                disabled={numberOfParts === 2}
                onClick={() => {
                  setValue("numberOfParts", numberOfParts - 1)
                }}
              >
                <ChevronDown />
              </Button>
              <Button
                variant="outline"
                size="iconXs"
                disabled={numberOfParts === 100}
                onClick={() => {
                  setValue("numberOfParts", numberOfParts + 1)
                }}
              >
                <ChevronUp />
              </Button>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent>
                <div className="text-muted-foreground text-sm">
                  Buy Per Part
                </div>
                <div className="inline-flex items-center gap-1 text-2xl font-semibold tracking-[-0.05em]">
                  {formatter.value(
                    quoteTokenAmount / numberOfParts,
                    formatter.decimals(quoteTokenAmount / numberOfParts)
                  )}{" "}
                  <img
                    src={quoteToken.logoURI || images.unknown}
                    alt={quoteToken.name}
                    className="size-6 shrink-0 rounded-full"
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-muted-foreground text-sm">
                  Sell Per Part
                </div>
                <div className="inline-flex items-center gap-1 text-2xl font-semibold tracking-[-0.05em]">
                  {formatter.value(
                    baseTokenAmount / numberOfParts,
                    formatter.decimals(baseTokenAmount / numberOfParts)
                  )}{" "}
                  <img
                    src={baseToken.logoURI || images.unknown}
                    alt={baseToken.name}
                    className="size-6 shrink-0 rounded-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <Button
        className="w-full"
        size="lg"
        disabled={submit.isDisabled}
        variant={submit.isError ? "outline" : "default"}
      >
        {submit.label}
      </Button>
    </form>
  )
}
