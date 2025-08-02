"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"

import { USDC, USDT } from "@/config/token"
import { PlaceOrderFormData, placeOrderFormSchema } from "@/lib/schema"
import Navbar from "@/components/navbar"
import OrderListCard from "@/components/order-list-card"
import PlaceOrderCard from "@/components/place-order-card"
import PlaceOrderChartCard from "@/components/place-order-chart-card"
import { PlaceOrderProvider } from "@/components/place-order-provider"

export default function Home() {
  // Form setup with default values
  const form = useForm<PlaceOrderFormData>({
    resolver: zodResolver(placeOrderFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      type: "limit" as const,
      baseTokenA: USDC,
      baseTokenAmount: 0,
      quoteTokenA: USDT,
      quoteTokenAmount: 0,
      selectedInterval: 900,
      diffPercentage: 0,
      rate: 0,
      inversed: false,
      expiry: 24,
      numberOfParts: 2,
      isFixedRate: false, // Start with fixed diffPercentage mode
    },
  })

  return (
    <FormProvider {...form}>
      <PlaceOrderProvider>
        <main
          className="container min-h-screen flex-col space-y-4 py-8"
          style={
            {
              "--main-width": "400px",
            } as React.CSSProperties
          }
        >
          <Navbar />
          <div className="flex flex-1 justify-center gap-4">
            <div className="flex w-full flex-col gap-4">
              <PlaceOrderChartCard />
              <OrderListCard />
            </div>
            <PlaceOrderCard />
          </div>
        </main>
      </PlaceOrderProvider>
    </FormProvider>
  )
}
