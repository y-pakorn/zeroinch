import { Hex } from "viem"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { IAccount } from "@/types"

interface IAccountStore {
  account: IAccount | null
  createAccount: (seed: Hex) => void
}

export const useAccountStore = create()(
  persist(
    (set, get) => ({
      account: null,
      createAccount: (seed: Hex) => {
        const account: IAccount = {
          seed,
          notes: [],
        }
        set({ account })
      },
    }),
    {
      name: "account-storage",
    }
  )
)
