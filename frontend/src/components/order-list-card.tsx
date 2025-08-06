import { useEffect, useState } from "react"
import Link from "next/link"
import { Extension, LimitOrder } from "@1inch/limit-order-sdk"
import { useMutation } from "@tanstack/react-query"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { decodeEventLog, encodeFunctionData, Hex } from "viem"
import { serialize } from "wagmi"

import { client, explorer } from "@/config/chain"
import { contracts } from "@/config/contract"
import { images } from "@/config/image"
import { tokens } from "@/config/token"
import { getNoteHash } from "@/lib/crypto"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useOrders } from "@/hooks/use-orders"
import { useAccountStore } from "@/stores/account"
import { ILimitOrder } from "@/types"

import { Button } from "./ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"

export default function OrderListCard() {
  const [type, setType] = useState<"active-limit" | "history">("active-limit")

  const { limitOrders, orderHistory } = useOrders()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-2xl font-semibold">
          <span
            className={cn(
              type === "active-limit" && "text-foreground",
              "cursor-pointer"
            )}
            onClick={() => setType("active-limit")}
          >
            Limit Orders
          </span>
          /
          <span
            className={cn(
              type === "history" && "text-foreground",
              "cursor-pointer"
            )}
            onClick={() => setType("history")}
          >
            Order History
          </span>
        </div>
        <div className="text-2xl font-semibold">Auto Fill</div>
      </div>
      {type === "active-limit" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tx Hash</TableHead>
              <TableHead>You Pay</TableHead>
              <TableHead>You Receive</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {limitOrders.length > 0 ? (
              limitOrders.map((order) => (
                <LimitOrderRow key={order.id} order={order} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-24 text-center"
                >
                  No active limit orders
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {type === "history" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Since</TableHead>
              <TableHead>Trade</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderHistory.length > 0 ? (
              orderHistory.map((order) => {
                const baseToken = tokens[order.baseTokenA]!
                const quoteToken = tokens[order.quoteTokenA]!
                const status = !!order.cancelled
                  ? "Cancelled"
                  : !!order.filled
                    ? "Filled"
                    : "Expired"
                const since =
                  order.cancelled?.at ?? order.filled?.at ?? order.createdAt
                const txHash = order.cancelled?.txHash ?? order.filled?.txHash

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      {formatter.timeRelative(since / 1000)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {formatter.value(
                          order.baseTokenAmount,
                          formatter.decimals(order.baseTokenAmount)
                        )}{" "}
                        <img
                          src={baseToken.logoURI || images.unknown}
                          alt={baseToken.name}
                          className="size-4"
                        />
                        to
                        <img
                          src={quoteToken.logoURI || images.unknown}
                          alt={quoteToken.name}
                          className="size-4"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatter.usd(order.value)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-semibold">
                      {status}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${explorer}/tx/${txHash}`}
                        target="_blank"
                        className={cn(
                          "text-muted-foreground flex items-center gap-1 font-mono font-medium",
                          !txHash && "pointer-events-none cursor-default"
                        )}
                      >
                        {txHash ? (
                          <>
                            {txHash.slice(0, 10)}
                            <ExternalLink className="size-3" />
                          </>
                        ) : (
                          "-"
                        )}
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-24 text-center"
                >
                  No order history
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function LimitOrderRow({ order }: { order: ILimitOrder }) {
  const {
    addNote,
    cancelOrder: cancelOrderStore,
    fillOrder: fillOrderStore,
  } = useAccountStore()

  const baseToken = tokens[order.baseTokenA]!
  const quoteToken = tokens[order.quoteTokenA]!

  const cancelOrder = useMutation({
    mutationFn: async () => {
      const txData = encodeFunctionData({
        abi: contracts.zeroinch.abi,
        functionName: "cancel",
        args: [order.id, order.cancelPreImage],
      })

      const relayTxPromise = fetch("/api/relay", {
        method: "POST",
        body: JSON.stringify({ txData }),
      }).then((res) => res.json())
      toast.promise(relayTxPromise, {
        loading: "Submitting order cancel to relayer...",
        success: "Order cancelled",
      })
      const { tx, message } = (await relayTxPromise) as {
        tx: Hex
        message: string
      }

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
        error: "Failed to cancel order",
      })
      const txReceipt = await txReceiptPromise

      if (txReceipt.status !== "success") {
        toast.error("Failed to cancel order", {
          description: "Transaction reverted",
          action: {
            label: "View on Etherscan",
            onClick: () => {
              window.open(`${explorer}/tx/${tx}`, "_blank")
            },
          },
        })
        return
      }

      let newInsertedIndex: number | undefined
      for (const log of txReceipt.logs) {
        try {
          const decodedLog = decodeEventLog({
            abi: contracts.zeroinch.abi,
            data: log.data,
            topics: log.topics,
          })
          if (decodedLog.eventName === "NewLeaf") {
            newInsertedIndex = Number(decodedLog.args.insertedIndex)
            console.log("New cancelled leaf index", newInsertedIndex)
          }
        } catch (error) {}
      }

      if (newInsertedIndex === undefined) {
        toast.error("Failed to get inserted leaf index")
        return
      }

      const oneInchOrder = LimitOrder.fromDataAndExtension(
        order.oneInchOrder[0],
        Extension.decode(order.oneInchOrder[1])
      )
      const { note } = addNote(
        order.baseTokenA,
        oneInchOrder.makingAmount,
        newInsertedIndex,
        order.combinedSecret
      )

      console.log("New cancelled note", note.hash)

      cancelOrderStore(order.id, {
        at: new Date().getTime(),
        txHash: tx,
        noteHash: note.hash,
        leafIndex: newInsertedIndex,
      })
    },
  })

  const [shouldRetry, setShouldRetry] = useState(true)
  const [isFilling, setIsFilling] = useState(false)
  const fillOrder = useMutation({
    mutationKey: ["fill-order", order.id],
    retry: false,
    mutationFn: async () => {
      console.log("Filling order inside")
      const { tx, message, noRetry } = await fetch("/api/fill", {
        method: "POST",
        body: JSON.stringify({
          data: order.oneInchOrder[0],
          extension: order.oneInchOrder[1],
        }),
      }).then((res) => res.json())

      if (message && noRetry === true) {
        setShouldRetry(false)
      }

      if (!tx) return

      setIsFilling(true)
      const txReceiptPromise = client.waitForTransactionReceipt({
        hash: tx,
      })
      toast.promise(txReceiptPromise, {
        loading: "Filling order...",
      })
      const txReceipt = await txReceiptPromise
      if (txReceipt.status !== "success") {
        toast.error("Failed to fill order", {
          description: "Transaction reverted",
        })
        return
      }

      const oneInchOrder = LimitOrder.fromDataAndExtension(
        order.oneInchOrder[0],
        Extension.decode(order.oneInchOrder[1])
      )
      let newInsertedIndex: number | undefined
      for (const log of txReceipt.logs) {
        try {
          const decodedLog = decodeEventLog({
            abi: contracts.zeroinch.abi,
            data: log.data,
            topics: log.topics,
          })
          if (decodedLog.eventName === "NewLeaf") {
            newInsertedIndex = Number(decodedLog.args.insertedIndex)
            console.log("New filled leaf index", newInsertedIndex)
            console.log("New filled note", decodedLog.args.noteHash)
          }
        } catch (error) {}
      }

      if (newInsertedIndex === undefined) {
        toast.error("Failed to get inserted leaf index")
        return
      }

      const { note } = addNote(
        order.quoteTokenA,
        oneInchOrder.takingAmount,
        newInsertedIndex,
        order.combinedSecret
      )

      fillOrderStore(order.id, {
        at: new Date().getTime(),
        txHash: tx,
        noteHash: note.hash,
        leafIndex: newInsertedIndex,
        actualQuoteTokenAmount: note.balance,
      })
      toast.success("Order filled", {
        description: `The ${baseToken.symbol} > ${quoteToken.symbol} trade was successful and has been filled.`,
      })
    },
    onSettled: () => {
      // always reset the filling state
      setIsFilling(false)
    },
  })

  useEffect(() => {
    fillOrder.mutate()
    const interval = setInterval(() => {
      fillOrder.mutate()
    }, 25000)
    return () => clearInterval(interval)
  }, [])

  return (
    <TableRow key={order.id}>
      <TableCell>
        <Link
          href={`${explorer}/tx/${order.txHash}`}
          target="_blank"
          className="text-muted-foreground flex items-center gap-1 font-mono font-medium"
        >
          {order.txHash.slice(0, 10)}
          <ExternalLink className="size-3" />
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {formatter.value(
            order.baseTokenAmount,
            formatter.decimals(order.baseTokenAmount)
          )}{" "}
          <img
            src={baseToken.logoURI || images.unknown}
            alt={baseToken.name}
            className="size-4"
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {formatter.value(
            order.minQuoteTokenAmount,
            tokens[order.quoteTokenA].decimals
          )}{" "}
          <img
            src={quoteToken.logoURI || images.unknown}
            alt={quoteToken.name}
            className="size-4"
          />
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatter.usd(order.value)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {order.expiredAt > Date.now()
          ? formatter.timeRelative(order.expiredAt / 1000)
          : "Expired"}
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => cancelOrder.mutate()}
          disabled={cancelOrder.isPending || fillOrder.isPending}
        >
          {cancelOrder.isPending ? (
            <>
              Cancelling... <Loader2 className="animate-spin" />
            </>
          ) : (
            "Cancel"
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fillOrder.mutate()}
          disabled={fillOrder.isPending || isFilling}
        >
          Try Fill{" "}
          {(fillOrder.isPending || isFilling) && (
            <Loader2 className="animate-spin" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  )
}
