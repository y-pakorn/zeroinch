import { Hex } from "viem"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { getRandomHex } from "@/lib/crypto"
import { IAccount, IOrder } from "@/types"

interface IAccountStore {
  account: IAccount
  addOrder: (order: IOrder) => void
  cancelOrder: (id: Hex) => void
}

export const useAccountStore = create<IAccountStore>()(
  persist(
    (set, get) => ({
      account: {
        seed: getRandomHex(),
        notes: [],
        orders: [],
      },
      addOrder: (order: IOrder) => {
        const account = get().account
        set({ account: { ...account, orders: [...account.orders, order] } })
      },
      cancelOrder: (id: Hex) => {
        set(({ account }) => ({
          account: {
            ...account,
            orders: account.orders.map((order) =>
              order.id === id
                ? {
                    ...order,
                    cancelled: {
                      at: Date.now(),
                      txHash: getRandomHex(),
                    },
                  }
                : order
            ),
          },
        }))
      },
    }),
    {
      name: `account-storage-v0.0.02`,
    }
  )
)
