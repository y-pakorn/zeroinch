import { poseidon2Hash } from "@zkpassport/poseidon2"
import { fromBytes, fromHex, toHex } from "viem"

import { ICombinedSecret, INote } from "@/types"

const n =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n

export const getRandomHex = () => {
  return toHex(
    fromBytes(crypto.getRandomValues(new Uint8Array(32)), "bigint") % n
  )
}

export const getNoteHash = (note: INote) => {
  return poseidon2Hash([
    note.asset_address,
    note.asset_balance,
    fromHex(note.combinedSecret.secret, "bigint"),
  ])
}

export const getCombinedSecretHash = (combinedSecret: ICombinedSecret) => {
  return toHex(
    poseidon2Hash([
      fromHex(combinedSecret.secret, "bigint"),
      fromHex(combinedSecret.nonce, "bigint"),
    ])
  )
}
