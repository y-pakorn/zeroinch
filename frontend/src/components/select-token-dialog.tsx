import { Address } from "viem"

import { images } from "@/config/image"
import { tokens } from "@/config/token"
import { cn } from "@/lib/utils"
import { IToken } from "@/types"

import { Badge } from "./ui/badge"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"

export function SelectTokenDialog({
  open,
  onOpenChange,
  excludeTokens,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  excludeTokens?: Address[]
  onSelect?: (token: IToken) => void
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search token name or address..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Tokens">
          {Object.values(tokens).map((token) => {
            const isExcluded = excludeTokens?.includes(token.address)
            return (
              <CommandItem
                keywords={[token.address]}
                key={token.address}
                onSelect={() => {
                  onSelect?.(token)
                  onOpenChange(false)
                }}
                className={cn(isExcluded && "pointer-events-none opacity-50")}
              >
                <img
                  src={token.logoURI || images.unknown}
                  alt={token.name}
                  className="size-7 shrink-0 rounded-full"
                />
                <div>
                  <div className="font-medium">
                    {token.name} ({token.symbol})
                  </div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {token.address}
                  </div>
                </div>
                {isExcluded && (
                  <Badge variant="outline" className="ml-auto">
                    Selected
                  </Badge>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
