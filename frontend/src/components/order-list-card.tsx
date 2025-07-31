import { useState } from "react"

import { images } from "@/config/image"
import { tokens } from "@/config/token"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useOrders } from "@/hooks/use-orders"
import { useAccountStore } from "@/stores/account"

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
  const { cancelOrder } = useAccountStore()

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

                return (
                  <TableRow key={order.id}>
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
                        onClick={() => {
                          cancelOrder(order.id)
                        }}
                      >
                        Cancel
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
              <TableHead>Type</TableHead>
              <TableHead>Trade</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderHistory.length > 0 ? (
              orderHistory.map((order) => {
                const baseToken = tokens[order.baseTokenA]!
                const quoteToken = tokens[order.quoteTokenA]!

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      {order.type === "limit" ? "Limit" : "TWAP"}
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
                    <TableCell className="text-muted-foreground">
                      {!!order.cancelled
                        ? "Cancelled"
                        : order.type === "limit" && order.expiredAt > Date.now()
                          ? "Expired"
                          : "Success"}
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
