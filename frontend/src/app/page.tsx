"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"
import { Address } from "viem"

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
      baseTokenA: "0x4200000000000000000000000000000000000006" as Address,
      baseTokenAmount: 0,
      quoteTokenA: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as Address,
      quoteTokenAmount: 0,
      selectedInterval: 900,
      diffPercentage: 0,
      inversed: false,
      expiry: 24,
      numberOfParts: 2,
    },
  })

  return (
    <FormProvider {...form}>
      <PlaceOrderProvider>
        <main
          className="container min-h-screen flex-col space-y-4 py-8"
          style={
            {
              "--main-width": "440px",
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
