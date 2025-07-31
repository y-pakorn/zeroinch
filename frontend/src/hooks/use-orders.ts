import { useMemo } from "react"
import _ from "lodash"

import { useAccountStore } from "@/stores/account"
import { ILimitOrder, IOrder } from "@/types"

export const useOrders = () => {
  const {
    account: { orders },
  } = useAccountStore()

  return useMemo(() => {
    const limitOrders: ILimitOrder[] = []
    const orderHistory: IOrder[] = []

    orders.forEach((order) => {
      if (order.type === "limit") {
        if (
          order.expiredAt < Date.now() ||
          !!order.claimed ||
          !!order.cancelled
        ) {
          orderHistory.push(order)
        } else {
          limitOrders.push(order)
        }
      }
    })
    return {
      limitOrders,
      orderHistory,
    }
  }, [orders])
}
