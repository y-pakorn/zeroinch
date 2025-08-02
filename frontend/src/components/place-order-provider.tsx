import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ExtensionBuilder,
  FeeTakerExt,
  Interaction,
  LimitOrder,
  LimitOrderWithFee,
  MakerTraits,
  Address as OneInchAddress,
  OrderInfoData,
  randBigInt,
  ZX,
} from "@1inch/limit-order-sdk"
import BigNumber from "bignumber.js"
import _ from "lodash"
import { Loader2 } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"
import {
  Address,
  decodeEventLog,
  encodeAbiParameters,
  encodeFunctionData,
  Hex,
  keccak256,
  parseAbiParameter,
  toHex,
} from "viem"
import { serialize, usePublicClient, useWriteContract } from "wagmi"

import { chain, explorer } from "@/config/chain"
import { contracts } from "@/config/contract"
import { tokens } from "@/config/token"
import {
  getCombinedSecretHash,
  getEmptyMerkleProof,
  getEmptyNote,
  getLeafs,
  getNoteHash,
  getRandomHex,
  hashTwoNormalized,
  prove,
  zeroBytes,
  zeroMerkleTree,
} from "@/lib/crypto"
import { PlaceOrderFormData } from "@/lib/schema"
import { bigNumberToBigInt } from "@/lib/utils"
import { useInternalBalances } from "@/hooks/use-internal-balances"
import { useMarketPrice } from "@/hooks/use-market-price"
import { useAccountStore } from "@/stores/account"
import { ILimitOrder, IPrimitiveNote, IToken } from "@/types"

import { Card, CardContent } from "./ui/card"

export const PlaceOrderContext = createContext<{
  marketPrice: BigNumber
  prices: Record<Address, number> | undefined
  baseToken: IToken
  quoteToken: IToken
  submit: {
    label: ReactNode
    isLoading: boolean
    isDisabled: boolean
    isError: boolean
  }
  handleSubmit: (data: PlaceOrderFormData) => void
}>({} as any)

export const PlaceOrderProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const {
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
    resetField,
  } = useFormContext<PlaceOrderFormData>()
  const {
    baseTokenA,
    quoteTokenA,
    baseTokenAmount,
    quoteTokenAmount,
    diffPercentage,
    rate,
    inversed,
    isFixedRate,
  } = watch()

  const { data: prices } = useMarketPrice({
    queryOptions: {
      refetchInterval: 5000, // 4 seconds
    },
  })

  const baseToken = tokens[baseTokenA]!
  const quoteToken = tokens[quoteTokenA]!

  const marketPrice = useMemo(() => {
    return new BigNumber(prices?.[baseTokenA] || 0).div(
      prices?.[quoteTokenA] || 1
    )
  }, [baseTokenA, quoteTokenA, prices])

  // Calculate effective market price based on inverse state
  const effectiveMarketPrice = useMemo(() => {
    return inversed ? marketPrice.pow(-1) : marketPrice
  }, [marketPrice, inversed])

  // Update rate/diffPercentage when market price changes
  useEffect(() => {
    if (marketPrice.isZero()) return

    if (isFixedRate) {
      // Fixed rate mode: calculate diffPercentage from rate
      if (rate > 0) {
        const newDiffPercentage = effectiveMarketPrice.isZero()
          ? 0
          : new BigNumber(rate)
              .minus(effectiveMarketPrice)
              .div(effectiveMarketPrice)
              .toNumber()
        setValue("diffPercentage", newDiffPercentage)
      }
    } else {
      // Fixed diffPercentage mode: calculate rate from diffPercentage
      const newRate = effectiveMarketPrice
        .multipliedBy(diffPercentage + 1)
        .toNumber()
      setValue("rate", newRate)
    }
  }, [
    marketPrice,
    effectiveMarketPrice,
    isFixedRate,
    rate,
    diffPercentage,
    setValue,
  ])

  const internalBalances = useInternalBalances()

  const submit = useMemo(() => {
    const hasErrors = Object.keys(errors).length > 0
    const firstErrorMsg = Object.values(errors)[0]?.message || "Error"
    const isInsufficientBalance =
      !internalBalances[baseTokenA] ||
      internalBalances[baseTokenA] < baseTokenAmount

    return {
      isError: hasErrors || isInsufficientBalance,
      label: isSubmitting ? (
        <>
          Placing Order... <Loader2 className="animate-spin" />
        </>
      ) : hasErrors ? (
        firstErrorMsg
      ) : isInsufficientBalance ? (
        "Insufficient balance :("
      ) : (
        "Place Order"
      ),
      isLoading: isSubmitting,
      isDisabled: hasErrors || isSubmitting || isInsufficientBalance,
    }
  }, [
    errors,
    isSubmitting,
    isValid,
    baseTokenAmount,
    baseTokenA,
    internalBalances,
  ])

  const { calculateNotes, addNote, removeNotes, addOrder } = useAccountStore()

  const client = usePublicClient()

  const handleSubmit = async ({
    baseTokenA,
    baseTokenAmount,
    diffPercentage,
    expiry,
    inversed,
    isFixedRate,
    numberOfParts,
    quoteTokenA,
    quoteTokenAmount,
    rate,
    selectedInterval,
    type,
  }: PlaceOrderFormData) => {
    if (type === "twap") {
      toast.error("TWAP is not supported yet")
      return
    }

    if (
      !internalBalances[baseTokenA] ||
      internalBalances[baseTokenA] < baseTokenAmount
    ) {
      toast.error("Insufficient internal balance")
      return
    }

    const makingAmount = BigInt(
      new BigNumber(baseTokenAmount)
        .shiftedBy(tokens[baseTokenA].decimals)
        .toFixed(0)
    )
    const takingAmount = BigInt(
      new BigNumber(quoteTokenAmount)
        .shiftedBy(tokens[quoteTokenA].decimals)
        .toFixed(0)
    )
    const orderInfo: OrderInfoData = {
      maker: new OneInchAddress(contracts.zeroinch.address),
      makerAsset: new OneInchAddress(baseTokenA),
      takerAsset: new OneInchAddress(quoteTokenA),
      makingAmount,
      takingAmount,
    }
    const expiredAt = Date.now() + 1000 * 60 * 60 * expiry // expiry in hours

    const makerTraits = MakerTraits.default()
      .withExpiration(BigInt(Math.floor(expiredAt / 1000)))
      .disablePartialFills()
      .disableMultipleFills()
      .enablePostInteraction()
      .enablePostInteraction()
      .withExtension()

    const extension = new ExtensionBuilder()
      .withPostInteraction(
        new Interaction(new OneInchAddress(contracts.zeroinch.address), "0x00")
      )
      .withPreInteraction(
        new Interaction(new OneInchAddress(contracts.zeroinch.address), "0x00")
      )
      .build()
    const oneInchOrder = new LimitOrder(orderInfo, makerTraits, extension)
    const hash = oneInchOrder.getOrderHash(chain.id) as Hex
    const cancelPreImage = getRandomHex()
    const cancelHash = keccak256(
      encodeAbiParameters([parseAbiParameter("bytes32 a")], [cancelPreImage])
    )

    const normalizedOrderHash = hashTwoNormalized(hash)

    const order: ILimitOrder = {
      id: hash,
      normalizedOrderHash,
      type: "limit",
      baseTokenA: baseTokenA,
      quoteTokenA: quoteTokenA,
      baseTokenAmount: baseTokenAmount,
      minQuoteTokenAmount: quoteTokenAmount,
      marketPrice: marketPrice.toNumber(),
      value: quoteTokenAmount * (prices?.[quoteTokenA] || 0),
      expiredAt: expiredAt,
      createdAt: Date.now(),
      diffPercentage: diffPercentage,
      combinedSecret: {
        nonce: getRandomHex(),
        secret: getRandomHex(),
      },
      txHash: zeroBytes,
      cancelPreImage,
      cancelHash,
      oneInchOrder: oneInchOrder,
      rate,
    }

    const tree = await zeroMerkleTree()
    const leafs = await getLeafs()
    console.log("Leafs", leafs)
    tree.bulkInsert(leafs)

    const calculatedNotes = calculateNotes(baseTokenA, baseTokenAmount)

    if (calculatedNotes.notes.length > 2) {
      toast.error("Sorry, too many notes :(")
      return
    }

    if (calculatedNotes.notes.length === 0) {
      toast.error("Not enough notes to calculate order")
      return
    }

    let leftoverBalance = new BigNumber(
      new BigNumber(calculatedNotes.totalBalance)
        .minus(baseTokenAmount)
        .shiftedBy(tokens[baseTokenA].decimals)
    )

    const outputNotes: IPrimitiveNote[] = []
    if (leftoverBalance.gt(0)) {
      const outputNote: IPrimitiveNote = {
        combinedSecret: {
          secret: getRandomHex(),
          nonce: getRandomHex(),
        },
        asset_balance: bigNumberToBigInt(leftoverBalance),
        asset_address: baseTokenA,
      }
      outputNotes.push(outputNote)
    }

    const merkleRoot = tree.root as Hex
    const precompSecret = getCombinedSecretHash(order.combinedSecret)

    const inputNote1Proof =
      calculatedNotes.notes[0]?.leafIndex !== undefined
        ? {
            index: calculatedNotes.notes[0].leafIndex,
            path: tree.proof(calculatedNotes.notes[0].hash)
              .pathElements as Hex[],
          }
        : getEmptyMerkleProof()
    const inputNote2Proof =
      calculatedNotes.notes[1]?.leafIndex !== undefined
        ? {
            index: calculatedNotes.notes[1].leafIndex,
            path: tree.proof(calculatedNotes.notes[1].hash)
              .pathElements as Hex[],
          }
        : getEmptyMerkleProof()
    const inputNote1 = calculatedNotes.notes[0]?._note || getEmptyNote()
    const inputNote2 = calculatedNotes.notes[1]?._note || getEmptyNote()

    const outputNote1 = outputNotes[0] || getEmptyNote()
    const outputNote2 = outputNotes[1] || getEmptyNote()

    const outputNote1Hash = outputNotes[0]
      ? getNoteHash(outputNote1)
      : zeroBytes
    const outputNote2Hash = outputNotes[1]
      ? getNoteHash(outputNote2)
      : zeroBytes

    const proofPromise = prove({
      merkle_root: merkleRoot,
      included_asset: [baseTokenA, quoteTokenA],
      order_hash: normalizedOrderHash,
      precomp_secret: precompSecret,
      order_asset: {
        combinedSecret: {
          nonce: zeroBytes,
          secret: zeroBytes,
        },
        asset_balance: makingAmount,
        asset_address: baseTokenA,
      },
      nullifier: [
        inputNote1.combinedSecret.nonce,
        inputNote2.combinedSecret.nonce,
      ],
      inclusion_proof: [inputNote1Proof, inputNote2Proof],
      new_note_hash: [outputNote1Hash, outputNote2Hash],
      input_note: [inputNote1, inputNote2],
      output_note: [outputNote1, outputNote2],
    })
    toast.promise(proofPromise, {
      loading: "Generating ZK proof...",
      success: "ZK proof generated",
      error: "Failed to generate ZK proof",
    })
    const proof = await proofPromise
    const txData = encodeFunctionData({
      abi: contracts.zeroinch.abi,
      functionName: "order",
      args: [
        {
          merkleRoot,
          normalizedOrderHash,
          newNoteHash: [outputNote1Hash, outputNote2Hash],
          orderHash: hash,
          precompSecret,
          orderAsset: {
            assetAddress: baseTokenA,
            amount: makingAmount,
            cancelHash: order.cancelHash,
          },
          nullifier: [
            inputNote1.combinedSecret.nonce,
            inputNote2.combinedSecret.nonce,
          ],
        },
        toHex(proof.proof),
      ],
    })

    const relayTxPromise = fetch("/api/relay", {
      method: "POST",
      body: JSON.stringify({ txData }),
    }).then((res) => res.json())
    toast.promise(relayTxPromise, {
      loading: "Submitting order to relayer...",
      success: "Order submitted",
    })
    const { tx, message } = (await relayTxPromise) as {
      tx: Hex
      message: string
    }

    // if message is not empty, it means the relayer failed to relay the transaction
    if (message) {
      toast.error("Failed to relay transaction", {
        description: message,
      })
      return
    }

    const txReceiptPromise = client.waitForTransactionReceipt({
      hash: tx,
    })
    toast.promise(txReceiptPromise, {
      loading: "Waiting for transaction receipt...",
      success: "Transaction successful",
      error: "Failed to submit order",
    })
    const txReceipt = await txReceiptPromise

    if (txReceipt.status === "reverted") {
      toast.error("Failed to submit order", {
        description: txReceipt.transactionHash,
        action: {
          label: "View on Etherscan",
          onClick: () => {
            window.open(`${explorer}/tx/${txReceipt.transactionHash}`, "_blank")
          },
        },
      })
      return
    }

    order.txHash = txReceipt.transactionHash

    for (const log of txReceipt.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: contracts.zeroinch.abi,
          data: log.data,
          topics: log.topics,
        })
        if (decodedLog.eventName === "NewLeaf") {
          // find output note that matches the decoded log
          const outputNote = outputNotes.find(
            (note) => getNoteHash(note) === decodedLog.args.noteHash
          )
          console.log("Inserted leaf note", decodedLog.args.noteHash)
          if (outputNote) {
            const leafIndex = Number(decodedLog.args.insertedIndex)
            const { note } = addNote(
              outputNote.asset_address,
              outputNote.asset_balance,
              leafIndex,
              outputNote.combinedSecret
            )
            console.log("Added note", note.hash)
          }
        }
      } catch (error) {}
    }

    const removedNoteHashes = calculatedNotes.notes.map((note) => note.hash)
    removeNotes(removedNoteHashes)
    console.log("Removed notes", removedNoteHashes)

    addOrder(order)

    setValue("baseTokenAmount", 0)
    setValue("quoteTokenAmount", 0)
    setValue("diffPercentage", 0)
    setValue("rate", 0)
    setValue("isFixedRate", false)
  }

  return (
    <PlaceOrderContext.Provider
      value={{
        marketPrice,
        prices,
        baseToken,
        quoteToken,
        submit,
        handleSubmit,
      }}
    >
      {children}
    </PlaceOrderContext.Provider>
  )
}

export const usePlaceOrder = () => {
  const context = useContext(PlaceOrderContext)
  if (!context) {
    throw new Error("usePlaceOrder must be used within a PlaceOrderProvider")
  }
  return context
}
