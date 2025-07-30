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
          if (note.balance > 0) {
            acc[note.address] = (acc[note.address] || 0) + note.balance
          }
          return acc
        },
        {} as Record<Address, number>
      ),
    [notes]
  )
}
