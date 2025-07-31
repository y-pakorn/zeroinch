import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ExtensionBuilder,
  FeeTakerExt,
  Interaction,
  LimitOrder,
  LimitOrderWithFee,
  MakerTraits,
  Address as OneInchAddress,
  OrderInfoData,
  randBigInt,
  ZX,
} from "@1inch/limit-order-sdk"
import BigNumber from "bignumber.js"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"
import { Address, Hex } from "viem"
import { serialize } from "wagmi"

import { chain } from "@/config/chain"
import { contracts } from "@/config/contract"
import { tokens } from "@/config/token"
import { getRandomHex } from "@/lib/crypto"
import { PlaceOrderFormData } from "@/lib/schema"
import { useMarketPrice } from "@/hooks/use-market-price"
import { useAccountStore } from "@/stores/account"
import { ILimitOrder, IToken } from "@/types"

import { Card, CardContent } from "./ui/card"

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
    reset,
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

  const { addOrder, account } = useAccountStore()

  const handleSubmit = async (data: PlaceOrderFormData) => {
    if (data.type === "twap") {
      toast.error("TWAP is not supported yet")
      return
    }

    const makingAmount = BigInt(
      new BigNumber(baseTokenAmount)
        .shiftedBy(tokens[baseTokenA].decimals)
        .toFixed(0)
    )
    const takingAmount = BigInt(
      new BigNumber(quoteTokenAmount)
        .shiftedBy(tokens[quoteTokenA].decimals)
        .toFixed(0)
    )
    const orderInfo: OrderInfoData = {
      maker: new OneInchAddress(contracts.zeroinch.address),
      makerAsset: new OneInchAddress(baseTokenA),
      takerAsset: new OneInchAddress(quoteTokenA),
      makingAmount,
      takingAmount,
    }
    const expiredAt = Date.now() + 1000 * 60 * 60 * data.expiry // expiry in hours

    const makerTraits = MakerTraits.default()
      .withExpiration(BigInt(Math.floor(expiredAt / 1000)))
      .disablePartialFills()
      .disableMultipleFills()
      .enablePostInteraction()
      .enablePostInteraction()
      .withExtension()

    const extension = new ExtensionBuilder()
      .withPostInteraction(
        new Interaction(new OneInchAddress(contracts.zeroinch.address), "0x00")
      )
      .withPreInteraction(
        new Interaction(new OneInchAddress(contracts.zeroinch.address), "0x00")
      )
      .build()
    const oneInchOrder = new LimitOrder(orderInfo, makerTraits, extension)
    const hash = oneInchOrder.getOrderHash(chain.id) as Hex

    const order: ILimitOrder = {
      id: hash,
      type: "limit",
      baseTokenA: baseTokenA,
      quoteTokenA: quoteTokenA,
      baseTokenAmount: baseTokenAmount,
      minQuoteTokenAmount: quoteTokenAmount,
      marketPrice: marketPrice.toNumber(),
      value: quoteTokenAmount * (prices?.[quoteTokenA] || 0),
      expiredAt: expiredAt,
      createdAt: Date.now(),
      diffPercentage: diffPercentage,
      combinedSecret: {
        nonce: getRandomHex(),
        secret: getRandomHex(),
      },
      oneInchOrder: oneInchOrder,
      rate,
    }

    // addOrder(order)

    reset()
  }

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
