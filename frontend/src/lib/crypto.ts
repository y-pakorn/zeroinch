import { MerkleTree } from "fixed-merkle-tree"
import _ from "lodash"
import { poseidon2, poseidon3 } from "poseidon-lite"
import { fromBytes, fromHex, Hex, toHex } from "viem"

import { ICombinedSecret, IPrimitiveNote } from "@/types"

const n =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n

export const getRandomHex = () => {
  return toHex(
    fromBytes(crypto.getRandomValues(new Uint8Array(32)), "bigint") % n
  )
}

export const getNoteHash = (note: IPrimitiveNote) => {
  // First hash the combined secret: H(secret, nonce)
  const combinedSecretHash = getCombinedSecretHash(note.combinedSecret)
  // Then hash: H(asset_address, amount, H(secret, nonce))
  return toHex(
    poseidon3([
      fromHex(note.asset_address, "bigint"),
      BigInt(note.asset_balance),
      fromHex(combinedSecretHash, "bigint"),
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

export const getEmptyMerkleProof = (): { index: number; path: Hex[] } => {
  return {
    index: 0,
    path: _.range(10).map(() => "0x00"),
  }
}

export const getEmptyNote = (assetAddress: Hex = "0x00"): IPrimitiveNote => {
  return {
    asset_balance: "0x00",
    asset_address: assetAddress,
    combinedSecret: {
      nonce: "0x00",
      secret: "0x00",
    },
  }
}

export const testCrypto = async () => {
  const tree = await zeroMerkleTree()

  const firstNote: IPrimitiveNote = {
    asset_balance: toHex(100n),
    asset_address: "0x01",
    combinedSecret: {
      nonce: getRandomHex(),
      secret: getRandomHex(),
    },
  }

  const toFirstNote: IPrimitiveNote = {
    asset_balance: toHex(60n),
    asset_address: "0x01",
    combinedSecret: {
      nonce: getRandomHex(),
      secret: getRandomHex(),
    },
  }

  const toSecondNote: IPrimitiveNote = {
    asset_balance: toHex(40n),
    asset_address: "0x01",
    combinedSecret: {
      nonce: getRandomHex(),
      secret: getRandomHex(),
    },
  }

  const firstNoteHash = getNoteHash(firstNote)
  const toFirstNoteHash = getNoteHash(toFirstNote)
  const toSecondNoteHash = getNoteHash(toSecondNote)

  tree.insert(firstNoteHash)

  const merkleProof = tree.path(0)

  console.log("Start proving")
  const now = performance.now()

  const proof = await prove({
    merkle_root: tree.root as Hex,
    order_hash: getRandomHex(),
    precomp_secret: getRandomHex(),
    included_asset: ["0x01", "0x02"],
    input_note: [firstNote, getEmptyNote()],
    output_note: [toFirstNote, toSecondNote],
    inclusion_proof: [
      {
        index: 0,
        path: merkleProof.pathElements as Hex[],
      },
      getEmptyMerkleProof(),
    ],
    order_asset: getEmptyNote(),
    new_note_hash: [toFirstNoteHash, toSecondNoteHash],
    nullifier: [firstNote.combinedSecret.nonce, "0x00"],
  })

  const end = performance.now()
  console.log(`Proving took ${end - now}ms`)
  console.log(proof)
}

export const zeroMerkleTree = async () => {
  const tree = new MerkleTree(10, [], {
    hashFunction: (left, right) => toHex(poseidon2([left, right])),
    zeroElement: "0x00",
  })

  return tree
}

export const initProver = async () => {
  const [{ Noir }, { UltraHonkBackend }] = await Promise.all([
    import("@noir-lang/noir_js"),
    import("@aztec/bb.js"),
  ])
  const circuit = await import("../../zeroinch.json")
  return { Noir, UltraHonkBackend, circuit: circuit.default }
}

export const prove = async ({
  merkle_root,
  order_hash,
  precomp_secret,
  order_asset,
  nullifier,
  new_note_hash,
  included_asset,
  input_note,
  output_note,
  inclusion_proof,
}: {
  merkle_root: Hex
  order_hash: Hex
  precomp_secret: Hex
  order_asset: IPrimitiveNote
  nullifier: Hex[]
  new_note_hash: Hex[]
  included_asset: Hex[]
  input_note: IPrimitiveNote[]
  output_note: IPrimitiveNote[]
  inclusion_proof: {
    index: number
    path: Hex[]
  }[]
}) => {
  const { Noir, UltraHonkBackend, circuit } = await initProver()
  const prover = new Noir(circuit as any)
  const backend = new UltraHonkBackend(circuit.bytecode)

  const noteToInput = (note: IPrimitiveNote) => {
    return {
      asset_address: note.asset_address,
      amount: toHex(BigInt(note.asset_balance)),
      secret: {
        secret: note.combinedSecret.secret,
        nonce: note.combinedSecret.nonce,
      },
    }
  }

  const witness = await prover.execute({
    merkle_root,
    order_hash,
    precomp_secret,
    order_asset: noteToInput(order_asset),
    nullifier,
    new_note_hash,
    included_asset,
    input_note: input_note.map(noteToInput),
    output_note: output_note.map(noteToInput),
    inclusion_proof,
  })

  const proof = await backend.generateProof(witness.witness)

  return proof
}
