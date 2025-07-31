import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import BigNumber from "bignumber.js"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"
import { Address } from "viem"

import { tokens } from "@/config/token"
import { getRandomHex } from "@/lib/crypto"
import { PlaceOrderFormData } from "@/lib/schema"
import { useMarketPrice } from "@/hooks/use-market-price"
import { useAccountStore } from "@/stores/account"
import { IToken } from "@/types"

export const PlaceOrderContext = createContext<{
  marketPrice: BigNumber
  prices: Record<Address, number> | undefined
  baseToken: IToken
  quoteToken: IToken
  submit: {
    label: string
    isLoading: boolean
    isDisabled: boolean
    isError: boolean
  }
  handleSubmit: (data: PlaceOrderFormData) => void
}>({} as any)

export const PlaceOrderProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const {
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useFormContext<PlaceOrderFormData>()
  const {
    baseTokenA,
    quoteTokenA,
    baseTokenAmount,
    quoteTokenAmount,
    diffPercentage,
    rate,
    inversed,
    isFixedRate,
  } = watch()

  const { data: prices } = useMarketPrice({
    queryOptions: {
      refetchInterval: 5000, // 4 seconds
    },
  })

  const baseToken = tokens[baseTokenA]!
  const quoteToken = tokens[quoteTokenA]!

  const marketPrice = useMemo(() => {
    return new BigNumber(prices?.[baseTokenA] || 0).div(
      prices?.[quoteTokenA] || 1
    )
  }, [baseTokenA, quoteTokenA, prices])

  // Calculate effective market price based on inverse state
  const effectiveMarketPrice = useMemo(() => {
    return inversed ? marketPrice.pow(-1) : marketPrice
  }, [marketPrice, inversed])

  // Update rate/diffPercentage when market price changes
  useEffect(() => {
    if (marketPrice.isZero()) return

    if (isFixedRate) {
      // Fixed rate mode: calculate diffPercentage from rate
      if (rate > 0) {
        const newDiffPercentage = effectiveMarketPrice.isZero()
          ? 0
          : new BigNumber(rate)
              .minus(effectiveMarketPrice)
              .div(effectiveMarketPrice)
              .toNumber()
        setValue("diffPercentage", newDiffPercentage)
      }
    } else {
      // Fixed diffPercentage mode: calculate rate from diffPercentage
      const newRate = effectiveMarketPrice
        .multipliedBy(diffPercentage + 1)
        .toNumber()
      setValue("rate", newRate)
    }
  }, [
    marketPrice,
    effectiveMarketPrice,
    isFixedRate,
    rate,
    diffPercentage,
    setValue,
  ])

  const submit = useMemo(() => {
    const hasErrors = Object.keys(errors).length > 0
    const firstErrorMsg = Object.values(errors)[0]?.message || "Error"

    return {
      isError: hasErrors,
      label: isSubmitting
        ? "Placing Order..."
        : hasErrors
          ? firstErrorMsg
          : "Place Order",
      isLoading: isSubmitting,
      isDisabled:
        hasErrors || isSubmitting || !baseTokenAmount || !quoteTokenAmount,
    }
  }, [errors, isSubmitting, isValid])

  const { addOrder } = useAccountStore()
  const handleSubmit = useCallback(
    (data: PlaceOrderFormData) => {
      if (data.type === "twap") {
        toast.error("TWAP is not supported yet")
        return
      }

      addOrder({
        id: getRandomHex(),
        type: "limit",
        baseTokenA: data.baseTokenA,
        quoteTokenA: data.quoteTokenA,
        baseTokenAmount: data.baseTokenAmount,
        minQuoteTokenAmount: data.quoteTokenAmount,
        marketPrice: marketPrice.toNumber(),
        value: data.quoteTokenAmount * (prices?.[data.quoteTokenA] || 0),
        createdAt: Date.now(),
        expiredAt: Date.now() + data.expiry * 60 * 60 * 1000, // expiry in hours
        diffPercentage: data.diffPercentage,
        rate: data.rate,
      })
    },
    [prices, marketPrice]
  )

  return (
    <PlaceOrderContext.Provider
      value={{
        marketPrice,
        prices,
        baseToken,
        quoteToken,
        submit,
        handleSubmit,
      }}
    >
      {children}
    </PlaceOrderContext.Provider>
  )
}

export const usePlaceOrder = () => {
  const context = useContext(PlaceOrderContext)
  if (!context) {
    throw new Error("usePlaceOrder must be used within a PlaceOrderProvider")
  }
  return context
}
