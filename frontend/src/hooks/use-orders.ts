import { useMemo } from "react"
import _ from "lodash"

import { useAccountStore } from "@/stores/account"
import { ILimitOrder, IOrder, ITwapOrder } from "@/types"

export const useOrders = () => {
  const {
    account: { orders },
  } = useAccountStore()

  const { limitOrders, twapOrders, orderHistory } = useMemo(() => {
    const limitOrders: ILimitOrder[] = []
    const twapOrders: ITwapOrder[] = []
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
      if (order.type === "twap") {
        if (
          order.endAt + 600000 < Date.now() ||
          !!order.claimed ||
          !!order.cancelled
        ) {
          orderHistory.push(order)
        } else {
          twapOrders.push(order)
        }
      }
    })
    return {
      limitOrders,
      twapOrders,
      orderHistory,
    }
  }, [orders])

  return { limitOrders, twapOrders, orderHistory }
}
