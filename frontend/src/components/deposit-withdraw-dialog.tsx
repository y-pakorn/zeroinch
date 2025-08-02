import { useCallback, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import BigNumber from "bignumber.js"
import {
  ArrowLeftRight,
  ChevronDown,
  Loader2,
  LogOut,
  Wallet,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import { toast } from "sonner"
import {
  Address,
  decodeEventLog,
  encodeFunctionData,
  encodePacked,
  erc20Abi,
  fromHex,
  Hex,
  keccak256,
  toHex,
} from "viem"
import {
  useAccount,
  useBalance,
  useChainId,
  useClient,
  useDisconnect,
  usePrepareTransactionRequest,
  usePublicClient,
  useReadContract,
  useSwitchAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"

import { chain, client, explorer } from "@/config/chain"
import { contracts } from "@/config/contract"
import { images } from "@/config/image"
import { tokens, WETH } from "@/config/token"
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
import {
  DepositWithdrawFormData,
  depositWithdrawFormSchema,
} from "@/lib/schema"
import { bigNumberToBigInt } from "@/lib/utils"
import { useInternalBalances } from "@/hooks/use-internal-balances"
import { useAccountStore } from "@/stores/account"
import { ICombinedSecret, IPrimitiveNote } from "@/types"

import { SelectTokenDialog } from "./select-token-dialog"
import { TransparentInput } from "./transparent-input"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"

export function DepositWithdrawDialog({
  children,
  type,
}: {
  children: React.ReactNode
  type: "deposit" | "withdraw"
}) {
  const [open, setOpen] = useState(false)
  const { openConnectModal } = useConnectModal()

  const { address } = useAccount()

  const form = useForm<DepositWithdrawFormData>({
    resolver: zodResolver(depositWithdrawFormSchema),
    defaultValues: {
      tokenA: WETH,
      amount: 0,
      address,
    },
  })

  const { addNote, removeNotes, calculateNotes, account } = useAccountStore()

  const onSubmit = async (data: DepositWithdrawFormData) => {
    if (!data.amount) return

    if (type === "deposit") {
      if (!isEnoughAllowance) {
        await approve()
        return
      }

      await deposit()
    } else {
      await withdraw()
    }
  }

  const { amount, tokenA, address: formAddress } = form.watch()

  const token = tokens[tokenA]

  const [openTokenDialog, setOpenTokenDialog] = useState(false)
  const { disconnectAsync } = useDisconnect()

  const { data: balance } = useBalance({
    address,
    token: tokenA as Address,
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenA as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.zeroinch.address] : undefined,
  })

  const isEnoughAllowance = useMemo(() => {
    if (!allowance) return false
    return new BigNumber(amount).shiftedBy(token.decimals).lte(allowance)
  }, [allowance, amount, token.decimals])

  const { writeContractAsync } = useWriteContract({
    mutation: {
      onError: (error) => {
        toast.error("Failed to send transaction", {
          description: error.message,
        })
      },
    },
  })
  const publicClient = usePublicClient()

  const approve = async () => {
    if (!address || !amount) return
    console.log(
      amount,
      BigInt(new BigNumber(amount).shiftedBy(token.decimals).toFixed(0))
    )
    const hash = await writeContractAsync({
      address: tokenA as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [
        contracts.zeroinch.address,
        BigInt(new BigNumber(amount).shiftedBy(token.decimals).toFixed(0)),
      ],
    })
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    })

    if (receipt.status === "success") {
      toast.success("Token allowance approved")
    } else {
      toast.error("Failed to approve token allowance")
    }

    refetchAllowance()
  }

  const deposit = async () => {
    if (!address || !amount) return

    const fullAmount = BigInt(
      new BigNumber(amount).shiftedBy(token.decimals).toFixed(0)
    )
    const combinedSecret: ICombinedSecret = {
      nonce: getRandomHex(),
      secret: getRandomHex(),
    }
    const combinedSecretHash = getCombinedSecretHash(combinedSecret)
    const hash = await writeContractAsync({
      address: contracts.zeroinch.address,
      abi: contracts.zeroinch.abi,
      functionName: "deposit",
      args: [tokenA, fullAmount, combinedSecretHash],
    })
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    })

    if (receipt.status === "reverted") {
      toast.error("Failed to deposit")
      return
    }

    let newLeaf:
      | {
          noteHash: string
          insertedIndex: number
        }
      | undefined
    receipt.logs.forEach((log) => {
      try {
        const event = decodeEventLog({
          abi: contracts.zeroinch.abi,
          topics: log.topics,
          data: log.data,
        })
        if (event.eventName === "NewLeaf") {
          newLeaf = {
            noteHash: event.args.noteHash,
            insertedIndex: Number(event.args.insertedIndex),
          }
          console.log(
            "Found new leaf with hash",
            newLeaf.noteHash,
            "in index",
            newLeaf.insertedIndex,
            "combinedSecret hash",
            event.args.secretHash,
            "local combinedSecret hash",
            combinedSecretHash
          )
          const notehash = getNoteHash({
            asset_balance: fullAmount,
            asset_address: tokenA,
            combinedSecret,
          })
          console.log("JIT Note hash", notehash)
        }
      } catch (_) {}
    })
    if (!newLeaf) {
      toast.error("Deposit note not found in event")
      return
    }
    addNote(tokenA, fullAmount, newLeaf.insertedIndex, combinedSecret)
    setOpen(false)
    form.resetField("amount")
    form.resetField("address")
    toast.success("Deposit successfully")
  }

  const withdraw = async () => {
    if (!address) {
      toast.error("Please specify recipient address")
      return
    }

    const { notes, totalBalance } = calculateNotes(tokenA, amount)

    if (totalBalance < amount) {
      toast.error("Not enough balance")
      return
    }

    if (notes.length > 2) {
      toast.error("Too many notes to withdraw :(")
      return
    }

    if (!notes.length) {
      toast.error("No notes to withdraw")
      return
    }

    const totalAmount = new BigNumber(amount).shiftedBy(tokens[tokenA].decimals)
    const amountBigInt = bigNumberToBigInt(totalAmount)
    let leftoverBalance = new BigNumber(
      new BigNumber(totalBalance)
        .minus(amount)
        .shiftedBy(tokens[tokenA].decimals)
    )

    const outputNotes: IPrimitiveNote[] = []
    if (leftoverBalance.gt(0)) {
      const outputNote: IPrimitiveNote = {
        combinedSecret: {
          secret: getRandomHex(),
          nonce: getRandomHex(),
        },
        asset_balance: bigNumberToBigInt(leftoverBalance),
        asset_address: tokenA,
      }
      outputNotes.push(outputNote)
    }

    const tree = await zeroMerkleTree()
    const leafs = await getLeafs()
    console.log("Leafs", leafs)
    tree.bulkInsert(leafs)

    const inputNote1 = notes[0]?._note || getEmptyNote()
    const inputNote2 = notes[1]?._note || getEmptyNote()

    const inputNote1Proof =
      notes[0]?.leafIndex !== undefined
        ? {
            index: notes[0].leafIndex,
            path: tree.proof(notes[0].hash).pathElements as Hex[],
          }
        : getEmptyMerkleProof()
    const inputNote2Proof =
      notes[1]?.leafIndex !== undefined
        ? {
            index: notes[1].leafIndex,
            path: tree.proof(notes[1].hash).pathElements as Hex[],
          }
        : getEmptyMerkleProof()

    const outputNote1 = outputNotes[0] || getEmptyNote()
    const outputNote2 = outputNotes[1] || getEmptyNote()

    const outputNote1Hash = outputNotes[0]
      ? getNoteHash(outputNote1)
      : zeroBytes
    const outputNote2Hash = outputNotes[1]
      ? getNoteHash(outputNote2)
      : zeroBytes

    const randomHash = fromHex(getRandomHex(), "bigint")
    const orderHash = keccak256(
      encodePacked(
        ["address", "uint256", "address", "uint256"],
        [tokenA, amountBigInt, address, randomHash]
      )
    )
    const normalizedOrderHash = hashTwoNormalized(orderHash)
    const merkleRoot = tree.root as Hex
    const precompSecret = zeroBytes

    const proofPromise = prove({
      merkle_root: merkleRoot,
      included_asset: [tokenA, tokenA],
      order_hash: normalizedOrderHash,
      precomp_secret: precompSecret,
      order_asset: {
        combinedSecret: {
          nonce: zeroBytes,
          secret: zeroBytes,
        },
        asset_balance: amountBigInt,
        asset_address: tokenA,
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

    // 1st step: order a "withdraw" order
    const orderWithdrawTxData = encodeFunctionData({
      abi: contracts.zeroinch.abi,
      functionName: "order",
      args: [
        {
          merkleRoot,
          normalizedOrderHash,
          newNoteHash: [outputNote1Hash, outputNote2Hash],
          orderHash,
          precompSecret,
          orderAsset: {
            assetAddress: tokenA,
            amount: amountBigInt,
            cancelHash: zeroBytes,
          },
          nullifier: [
            inputNote1.combinedSecret.nonce,
            inputNote2.combinedSecret.nonce,
          ],
        },
        toHex(proof.proof),
      ],
    })

    const relayWithdrawTxPromise = fetch("/api/relay", {
      method: "POST",
      body: JSON.stringify({ txData: orderWithdrawTxData }),
    }).then((res) => res.json())
    toast.promise(relayWithdrawTxPromise, {
      loading: "Submitting order cancel to relayer...",
      success: "Order cancel submitted",
    })
    const { tx, message } = (await relayWithdrawTxPromise) as {
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
      loading: "Waiting for order withdraw transaction receipt...",
      success: "Order withdraw transaction successful",
      error: "Failed to submit order withdraw",
    })
    const txReceipt = await txReceiptPromise

    if (txReceipt.status === "reverted") {
      toast.error("Failed to submit order withdraw", {
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

    // remove the input notes
    removeNotes(notes.map((note) => note.hash))

    // 2nd step: execute the "withdraw" order
    const executeWithdrawTxData = encodeFunctionData({
      abi: contracts.zeroinch.abi,
      functionName: "withdraw",
      args: [tokenA, amountBigInt, address, randomHash],
    })

    const relayExecuteWithdrawTxPromise = fetch("/api/relay", {
      method: "POST",
      body: JSON.stringify({ txData: executeWithdrawTxData }),
    }).then((res) => res.json())
    toast.promise(relayExecuteWithdrawTxPromise, {
      loading: "Submitting withdraw to relayer...",
      success: "Withdraw submitted",
    })
    const { tx: executeWithdrawTx, message: executeWithdrawMessage } =
      (await relayExecuteWithdrawTxPromise) as {
        tx: Hex
        message: string
      }

    if (executeWithdrawMessage) {
      toast.error("Failed to relay transaction", {
        description: executeWithdrawMessage,
      })
      return
    }

    const executeWithdrawTxReceiptPromise = client.waitForTransactionReceipt({
      hash: executeWithdrawTx,
    })
    toast.promise(executeWithdrawTxReceiptPromise, {
      loading: "Waiting for withdraw transaction receipt...",
      success: "Withdraw transaction successful",
      error: "Failed to submit withdraw",
    })
    const executeWithdrawTxReceipt = await executeWithdrawTxReceiptPromise

    if (executeWithdrawTxReceipt.status === "reverted") {
      toast.error("Failed to submit withdraw", {
        description: executeWithdrawTxReceipt.transactionHash,
      })
      return
    }

    setOpen(false)
    form.resetField("amount")
    form.resetField("address")
    toast.success("Withdraw successfully")
  }

  const internalBalances = useInternalBalances()

  const isInsufficientBalance = useMemo(() => {
    if (type === "deposit") {
      if (!balance) return false
      return new BigNumber(balance.value)
        .shiftedBy(-balance.decimals)
        .lt(amount)
    } else {
      if (!internalBalances[tokenA]) return false
      return amount > internalBalances[tokenA]
    }
  }, [balance, amount, internalBalances, tokenA])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "deposit" ? "Deposit" : "Withdraw"}
          </DialogTitle>
          <DialogDescription>
            {`${type === "deposit" ? "Deposit to" : "Withdraw from"} your protocol's internal account`}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="text-muted-foreground text-sm">Amount</div>
          <div className="flex items-center gap-2">
            <NumericFormat
              value={amount}
              customInput={TransparentInput}
              thousandSeparator
              className="h-10 w-full text-3xl! font-semibold tracking-[-0.05em]"
              placeholder="0.0"
              allowNegative={false}
              onValueChange={(value, { source }) => {
                form.setValue("amount", value.floatValue || 0, {
                  shouldValidate: true,
                })
              }}
              decimalScale={token.decimals}
            />
            <SelectTokenDialog
              open={openTokenDialog}
              onOpenChange={setOpenTokenDialog}
              onSelect={(token) => {
                form.setValue("tokenA", token.address)
              }}
              excludeTokens={[tokenA]}
            />

            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => setOpenTokenDialog(true)}
            >
              <img
                src={token.logoURI || images.unknown}
                alt={token.name}
                className="size-6 rounded-full"
              />
              <span className="text-2xl font-semibold">{token.symbol}</span>
              <ChevronDown className="size-5" />
            </Button>
          </div>

          {type === "withdraw" && (
            <>
              <div className="text-muted-foreground text-sm">Address</div>
              <div className="flex items-center gap-2">
                <TransparentInput
                  {...form.register("address")}
                  className="h-10 w-full text-3xl! font-semibold tracking-[-0.05em]"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  placeholder="0x0000000000000000000000000000000000000000"
                />
                {address && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => form.setValue("address", address)}
                  >
                    Use Wallet Address
                  </Button>
                )}
              </div>
            </>
          )}

          <div className="space-y-1">
            {address && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="shrink-0">Connected Wallet</div>
                <span className="text-muted-foreground ml-auto truncate">
                  {address}
                </span>{" "}
                <Button
                  type="button"
                  variant="ghost"
                  size="iconXs"
                  onClick={() => disconnectAsync()}
                >
                  <LogOut />
                </Button>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="shrink-0">Wallet Balance</div>
                <Wallet className="text-muted-foreground ml-auto size-3.5" />
                <span className="text-muted-foreground truncate">
                  {!balance ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    new BigNumber(balance.value)
                      .shiftedBy(-balance.decimals)
                      .toNumber()
                  )}
                </span>
                {type === "deposit" && (
                  <>
                    {" "}
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={!balance}
                      onClick={() => {
                        if (!balance) return
                        form.setValue(
                          "amount",
                          new BigNumber(balance.value)
                            .shiftedBy(-balance.decimals)
                            .toNumber() / 2,
                          {
                            shouldValidate: true,
                          }
                        )
                      }}
                    >
                      Half
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={!balance}
                      onClick={() => {
                        if (!balance) return
                        form.setValue(
                          "amount",
                          new BigNumber(balance.value)
                            .shiftedBy(-balance.decimals)
                            .toNumber(),
                          { shouldValidate: true }
                        )
                      }}
                    >
                      Max
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="shrink-0">Internal Balance</div>
              <Wallet className="text-muted-foreground ml-auto size-3.5" />
              <span className="text-muted-foreground truncate">
                {internalBalances[tokenA] || "0"}
              </span>
              {type === "withdraw" && (
                <>
                  {" "}
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={!internalBalances[tokenA]}
                    onClick={() => {
                      if (!internalBalances[tokenA]) return
                      form.setValue("amount", internalBalances[tokenA] / 2, {
                        shouldValidate: true,
                      })
                    }}
                  >
                    Half
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={!internalBalances[tokenA]}
                    onClick={() => {
                      if (!internalBalances[tokenA]) return
                      form.setValue("amount", internalBalances[tokenA], {
                        shouldValidate: true,
                      })
                    }}
                  >
                    Max
                  </Button>
                </>
              )}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={
              !amount || form.formState.isSubmitting || isInsufficientBalance
            }
            variant={!address ? "outline" : "default"}
            onClick={(e) => {
              if (!address) {
                e.preventDefault()
                openConnectModal?.()
              }
            }}
          >
            {!address
              ? "Connect Wallet"
              : isInsufficientBalance
                ? "Insufficient balance :("
                : type === "deposit"
                  ? isEnoughAllowance
                    ? form.formState.isSubmitting
                      ? "Depositing..."
                      : "Deposit"
                    : `Approve ${token.symbol}`
                  : form.formState.isSubmitting
                    ? "Withdrawing..."
                    : "Withdraw"}
            {form.formState.isSubmitting && (
              <Loader2 className="animate-spin" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
