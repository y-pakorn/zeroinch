import { useCallback, useState } from "react"
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
import { Address } from "viem"
import { useAccount, useBalance, useDisconnect, useSwitchAccount } from "wagmi"

import { images } from "@/config/image"
import { tokens } from "@/config/token"
import {
  DepositWithdrawFormData,
  depositWithdrawFormSchema,
} from "@/lib/schema"
import { useInternalBalances } from "@/hooks/use-internal-balances"
import { useAccountStore } from "@/stores/account"

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
      tokenA: "0x4200000000000000000000000000000000000006",
      amount: 0,
      address,
    },
  })

  const { addNote, removeNotes, calculateNotes, account } = useAccountStore()

  const onSubmit = useCallback(
    (data: DepositWithdrawFormData) => {
      if (type === "deposit") {
        addNote(data.tokenA, data.amount)
        setOpen(false)
        form.reset()
        toast.success("Deposit successfully")
      } else {
        const { notes, totalBalance } = calculateNotes(data.tokenA, data.amount)
        if (totalBalance < data.amount) {
          toast.error("Insufficient internal balance")
          return
        }

        const noteHashes = notes.map((note) => note.hash)
        removeNotes(noteHashes)

        const remainingBalance = totalBalance - data.amount
        if (remainingBalance > 0) {
          addNote(tokenA, remainingBalance)
        }

        setOpen(false)
        form.reset()
        toast.success("Withdraw successfully")
      }
    },
    [type]
  )

  const { amount, tokenA, address: formAddress } = form.watch()

  const token = tokens[tokenA]

  const [openTokenDialog, setOpenTokenDialog] = useState(false)
  const { disconnectAsync } = useDisconnect()

  const { data: balance } = useBalance({
    address,
    token: tokenA as Address,
  })

  const internalBalances = useInternalBalances()

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
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
              : type === "deposit"
                ? "Deposit"
                : "Withdraw"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
