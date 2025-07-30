import { ComponentProps, useEffect, useMemo, useState } from "react"
import { ChevronsUpDown, Loader2 } from "lucide-react"
import { Address } from "viem"

import { tokens } from "@/config/token"
import { formatter } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { useInternalBalances } from "@/hooks/use-internal-balances"
import { useMarketPrice } from "@/hooks/use-market-price"
import { useAccountStore } from "@/stores/account"

import { Button } from "./ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

export function InternalAccountButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  const {
    account: { seed },
  } = useAccountStore()

  const [rendered, setRendered] = useState(false)
  useEffect(() => {
    setRendered(true)
  }, [])

  const internalBalances = useInternalBalances()
  const balanceList = useMemo(
    () => Object.entries(internalBalances),
    [internalBalances]
  )

  const { data: prices } = useMarketPrice()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(className)}
          {...props}
        >
          Internal Account{" "}
          {rendered ? (
            <>
              <span className="text-muted-foreground">{seed.slice(0, 8)}</span>
              <div className="size-2 rounded-full bg-green-400" />
            </>
          ) : (
            <Loader2 className="animate-spin" />
          )}
          <ChevronsUpDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search balance..." />
          <CommandList>
            <CommandEmpty>No balance found.</CommandEmpty>
            <CommandGroup>
              {balanceList.map(([address, balance]) => {
                const tokenAddress = address as Address
                const token = tokens[tokenAddress]!
                return (
                  <CommandItem
                    key={address}
                    value={address}
                    className="gap-2"
                    keywords={[token.name, token.symbol, token.address]}
                  >
                    <img src={token.logoURI} alt={address} className="size-6" />
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {token.address.slice(0, 8)}...
                        {token.address.slice(-4)}
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="truncate font-medium">
                        {formatter.value(balance, formatter.decimals(balance))}
                      </div>
                      <div className="text-muted-foreground truncate font-mono text-xs">
                        {formatter.usd(balance * (prices?.[tokenAddress] || 0))}
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
