import { useConnectModal } from "@rainbow-me/rainbowkit"
import BigNumber from "bignumber.js"
import {
  ArrowLeftRight,
  ChevronsUpDown,
  Loader2,
  LogOut,
  Wallet,
} from "lucide-react"
import {
  useAccount,
  useBalance,
  useDisconnect,
  useEnsName,
  useSwitchAccount,
} from "wagmi"

import { formatter } from "@/lib/formatter"

import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export function ConnectWalletButton() {
  const { address, isConnecting } = useAccount()
  const { openConnectModal, connectModalOpen } = useConnectModal()

  const { data: ensName } = useEnsName({ address })
  const { disconnectAsync } = useDisconnect()
  const { connectors, switchAccount } = useSwitchAccount()

  const { data: balance } = useBalance({ address })

  if (!address) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => openConnectModal?.()}
        disabled={connectModalOpen || isConnecting}
      >
        {connectModalOpen || isConnecting ? (
          <>
            Connecting
            <Loader2 className="animate-spin" />
          </>
        ) : (
          <>
            Connect Wallet <Wallet />
          </>
        )}
      </Button>
    )
  }

  const balanceFormatted = balance
    ? new BigNumber(balance.value).shiftedBy(-balance.decimals).toNumber()
    : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="text-muted-foreground">Connected</span>{" "}
          {balanceFormatted === undefined ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {formatter.value(balanceFormatted)} {balance?.symbol}
            </>
          )}
          <ChevronsUpDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        <DropdownMenuLabel>
          {ensName || (
            <>
              {address.slice(0, 8)}...{address.slice(-6)}
            </>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowLeftRight />
            Switch Account
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {connectors.map((connector) => (
                <DropdownMenuItem
                  key={connector.id}
                  onSelect={() => switchAccount({ connector })}
                >
                  {connector.icon ? (
                    <img
                      src={connector.icon}
                      alt={connector.name}
                      className="size-4"
                    />
                  ) : (
                    <Wallet className="size-4" />
                  )}
                  {connector.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => disconnectAsync()}>
          <LogOut /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
