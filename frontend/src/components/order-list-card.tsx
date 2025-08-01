import { useState } from "react"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { decodeEventLog, encodeFunctionData, Hex } from "viem"

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

  const { addNote, cancelOrder: cancelOrderStore } = useAccountStore()
  const { limitOrders, orderHistory } = useOrders()

  const cancelOrder = useMutation({
    mutationFn: async (id: Hex) => {
      const order = limitOrders.find((order) => order.id === id)
      if (!order) {
        toast.error("Order not found")
        return
      }

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

      const { note } = addNote(
        order.baseTokenA,
        order.oneInchOrder.makingAmount,
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

  return (
    <div className="space-y-2">
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
              limitOrders.map((order) => {
                const baseToken = tokens[order.baseTokenA]!
                const quoteToken = tokens[order.quoteTokenA]!
                const isCancelling =
                  cancelOrder.variables === order.id && cancelOrder.isPending

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
                          formatter.decimals(order.minQuoteTokenAmount)
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
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelOrder.mutate(order.id)}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            Cancelling... <Loader2 className="animate-spin" />
                          </>
                        ) : (
                          "Cancel"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
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
                const since =
                  order.cancelled?.at ?? order.filled?.at ?? order.createdAt
                const txHash =
                  order.cancelled?.txHash ??
                  order.filled?.txHash ??
                  order.txHash

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
                      {!!order.cancelled
                        ? "Cancelled"
                        : order.type === "limit" && order.expiredAt > Date.now()
                          ? "Expired"
                          : "Success"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${explorer}/tx/${order.txHash}`}
                        target="_blank"
                        className="text-muted-foreground flex items-center gap-1 font-mono font-medium"
                      >
                        {txHash.slice(0, 10)}
                        <ExternalLink className="size-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
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
