import { poseidon2, poseidon3 } from "poseidon-lite"
import { fromBytes, fromHex, toHex } from "viem"

import { ICombinedSecret, IPrimitiveNote } from "@/types"

const n =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n

export const getRandomHex = () => {
  return toHex(
    fromBytes(crypto.getRandomValues(new Uint8Array(32)), "bigint") % n
  )
}

export const getNoteHash = (note: IPrimitiveNote) => {
  return toHex(
    poseidon3([
      fromHex(note.asset_address, "bigint"),
      BigInt(note.asset_balance),
      fromHex(note.combinedSecret.secret, "bigint"),
    ])
  )
}

export const getCombinedSecretHash = (combinedSecret: ICombinedSecret) => {
  return toHex(
    poseidon2([
      fromHex(combinedSecret.secret, "bigint"),
      fromHex(combinedSecret.nonce, "bigint"),
    ])
  )
}
