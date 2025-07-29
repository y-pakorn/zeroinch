import { Hex } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { IAccount, IOrder } from "@/types"

interface IAccountStore {
  account: IAccount
  addOrder: (order: IOrder) => void
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
    }),
    {
      name: "account-storage",
    }
  )
)
