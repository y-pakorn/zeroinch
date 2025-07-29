import { Hex } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { create } from "zustand"
import { persist } from "zustand/middleware"

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
        seed: generatePrivateKey(),
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
                      txHash: generatePrivateKey(),
                    },
                  }
                : order
            ),
          },
        }))
      },
    }),
    {
      name: `account-storage-v0.0.01`,
    }
  )
)
