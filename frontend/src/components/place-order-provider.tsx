import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import BigNumber from "bignumber.js"
import { useFormContext } from "react-hook-form"
import { Address } from "viem"

import { tokens } from "@/config/token"
import { PlaceOrderFormData } from "@/lib/schema"
import { useMarketPrice } from "@/hooks/use-market-price"
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    watch,
    formState: { errors, isValid },
  } = useFormContext<PlaceOrderFormData>()
  const { baseTokenA, quoteTokenA, baseTokenAmount, quoteTokenAmount } = watch()

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

  const handleSubmit = useCallback((data: PlaceOrderFormData) => {
    console.log("submit", data)
  }, [])

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
