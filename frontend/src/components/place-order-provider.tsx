import {
  createContext,
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
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"
import {
  Address,
  encodeAbiParameters,
  Hex,
  keccak256,
  parseAbiParameter,
  toHex,
} from "viem"
import { serialize, usePublicClient, useWriteContract } from "wagmi"

import { chain } from "@/config/chain"
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
    label: string
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
    reset,
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

  const submit = useMemo(() => {
    const hasErrors = Object.keys(errors).length > 0
    const firstErrorMsg = Object.values(errors)[0]?.message || "Error"

    return {
      isError: hasErrors,
      label: isSubmitting
        ? "Placing Order..."
        : hasErrors
          ? firstErrorMsg
          : "Place Order",
      isLoading: isSubmitting,
      isDisabled:
        hasErrors || isSubmitting || !baseTokenAmount || !quoteTokenAmount,
    }
  }, [errors, isSubmitting, isValid])

  const internalBalances = useInternalBalances()
  const { calculateNotes } = useAccountStore()

  const client = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const handleSubmit = async (data: PlaceOrderFormData) => {
    if (data.type === "twap") {
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
    const expiredAt = Date.now() + 1000 * 60 * 60 * data.expiry // expiry in hours

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

    const proof = await prove({
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

    console.log(proof)

    const tx = await writeContractAsync({
      address: contracts.zeroinch.address,
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

    const receipt = await client.waitForTransactionReceipt({
      hash: tx,
    })

    if (receipt.status === "reverted") {
      toast.error("Order submission failed", {
        description: receipt.transactionHash,
      })
      return
    }

    toast.success("Order submitted", {
      description: receipt.transactionHash,
    })

    // reset()
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
