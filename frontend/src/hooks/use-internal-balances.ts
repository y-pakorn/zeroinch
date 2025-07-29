import { useMemo } from "react"
import { Address } from "viem"

import { useAccountStore } from "@/stores/account"

export const useInternalBalances = () => {
  const {
    account: { notes },
  } = useAccountStore()

  return useMemo(
    () =>
      notes.reduce(
        (acc, note) => {
          acc[note.seed] = note.balance
          return acc
        },
        {} as Record<Address, number>
      ),
    [notes]
  )
}
