import BigNumber from "bignumber.js"
import { Address, fromHex, Hex } from "viem"
import { deserialize, serialize } from "wagmi"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { tokens } from "@/config/token"
import { getNoteHash, getRandomHex } from "@/lib/crypto"
import { bigNumberToBigInt } from "@/lib/utils"
import {
  IAccount,
  ICombinedSecret,
  INote,
  IOrder,
  IPrimitiveNote,
} from "@/types"

interface IAccountStore {
  account: IAccount
  addOrder: (order: IOrder) => void
  addNote: (
    tokenA: Address,
    balance: number,
    leafIndex: number,
    combinedSecret: ICombinedSecret
  ) => void
  removeNotes: (noteHashes: Hex[]) => void
  calculateNotes: (
    tokenA: Address,
    balance: number
  ) => {
    notes: INote[]
    totalBalance: number
  }
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
      addNote: (
        tokenA: Address,
        balance: number,
        leafIndex: number,
        combinedSecret: ICombinedSecret
      ) => {
        const primitiveNote: IPrimitiveNote = {
          combinedSecret,
          asset_balance: bigNumberToBigInt(
            BigNumber(balance).shiftedBy(tokens[tokenA].decimals)
          ).toString(),
          asset_address: tokenA,
        }
        const note: INote = {
          addedAt: Date.now(),
          hash: getNoteHash(primitiveNote),
          balance,
          address: tokenA,
          leafIndex,
          _note: primitiveNote,
        }
        console.log("Inserting note with hash", note.hash)
        const account = get().account
        set({ account: { ...account, notes: [...account.notes, note] } })
      },
      removeNotes: (noteHashes: Hex[]) => {
        const account = get().account
        set({
          account: {
            ...account,
            notes: account.notes.filter(
              (note) => !noteHashes.includes(note.hash)
            ),
          },
        })
      },
      calculateNotes: (tokenA: Address, balance: number) => {
        // return the minimum number of notes that are summed up to the balance
        const account = get().account
        const notes = account.notes.filter((note) => note.address === tokenA)
        const sortedNotes = notes.sort((a, b) => b.balance - a.balance)
        const result: INote[] = []
        let currentBalance = balance
        for (const note of sortedNotes) {
          if (currentBalance > 0) {
            result.push(note)
            currentBalance -= note.balance
          }
        }
        return {
          notes: result,
          totalBalance: result.reduce((acc, note) => acc + note.balance, 0),
        }
      },
    }),
    {
      name: `account-storage-v0.0.03`,
      storage: createJSONStorage(() => localStorage, {
        replacer: (_, value) => {
          return serialize(value)
        },
        reviver: (_, value) => {
          return deserialize(value as any)
        },
      }),
    }
  )
)
