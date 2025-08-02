import { MerkleTree } from "fixed-merkle-tree"
import _ from "lodash"
import { poseidon2, poseidon3 } from "poseidon-lite"
import { fromBytes, fromHex, Hex, hexToBigInt, pad, padHex, toHex } from "viem"

import { contracts } from "@/config/contract"
import { client } from "@/config/web3"
import { ICombinedSecret, IPrimitiveNote } from "@/types"

const n =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n

export const zeroBytes =
  "0x0000000000000000000000000000000000000000000000000000000000000000"

export const hashTwoNormalized = (h: Hex) => {
  const normalizedH = hexToBigInt(h) % n
  return toHex(poseidon2([normalizedH, normalizedH]))
}

export const getRandomHex = () => {
  return toHex(
    fromBytes(crypto.getRandomValues(new Uint8Array(32)), "bigint") % n
  )
}

export const getNoteHash = (note: IPrimitiveNote) => {
  // First hash the combined secret: H(secret, nonce)
  const combinedSecretHash = getCombinedSecretHash(note.combinedSecret)
  return toHex(
    poseidon3([
      fromHex(note.asset_address, "bigint"),
      BigInt(note.asset_balance),
      fromHex(combinedSecretHash, "bigint"),
    ]),
    {
      size: 32,
    }
  )
}

export const getCombinedSecretHash = (combinedSecret: ICombinedSecret) => {
  return toHex(
    poseidon2([
      fromHex(combinedSecret.secret, "bigint"),
      fromHex(combinedSecret.nonce, "bigint"),
    ]),
    {
      size: 32,
    }
  )
}

export const getEmptyMerkleProof = (): { index: number; path: Hex[] } => {
  return {
    index: 0,
    path: _.range(10).map(() => zeroBytes),
  }
}

export const getEmptyNote = (assetAddress: Hex = "0x00"): IPrimitiveNote => {
  return {
    asset_balance: 0n,
    asset_address: assetAddress,
    combinedSecret: {
      nonce: zeroBytes,
      secret: zeroBytes,
    },
  }
}

export const getLeafs = async () => {
  const leafCount = await client
    .readContract({
      address: contracts.zeroinch.address,
      abi: contracts.zeroinch.abi,
      functionName: "nextIndex",
    })
    .then((d) => Number(d))

  const leafs = await client
    .multicall({
      contracts: _.range(leafCount).map((i) => ({
        address: contracts.zeroinch.address,
        abi: contracts.zeroinch.abi,
        functionName: "leaves",
        args: [i],
      })),
      allowFailure: false,
    })
    .then((d) => d.map((d) => d as unknown as Hex))

  return leafs
}

export const testCrypto = async () => {}

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
      asset_address: pad(note.asset_address, {
        size: 32,
      }),
      amount: toHex(note.asset_balance, { size: 32 }),
      secret: {
        secret: pad(note.combinedSecret.secret, {
          size: 32,
        }),
        nonce: pad(note.combinedSecret.nonce, {
          size: 32,
        }),
      },
    }
  }

  const proverInput = {
    merkle_root: pad(merkle_root, {
      size: 32,
    }),
    order_hash: pad(order_hash, {
      size: 32,
    }),
    precomp_secret: pad(precomp_secret, {
      size: 32,
    }),
    order_asset: noteToInput(order_asset),
    nullifier: nullifier.map((n) => pad(n, { size: 32 })),
    new_note_hash: new_note_hash.map((n) => pad(n, { size: 32 })),
    included_asset: included_asset.map((n) => pad(n, { size: 32 })),
    input_note: input_note.map(noteToInput),
    output_note: output_note.map(noteToInput),
    inclusion_proof: inclusion_proof.map((p) => ({
      index: p.index,
      path: p.path.map((n) => pad(n, { size: 32 })),
    })),
  }

  console.log(proverInput)

  const witness = await prover.execute(proverInput)
  const proof = await backend.generateProof(witness.witness, {
    keccak: true,
  })

  console.log(proof)

  return proof
}
