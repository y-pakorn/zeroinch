import React from "react"

import { cn } from "@/lib/utils"

import { Input } from "./ui/input"

export function TransparentInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn(
        "rounded-none border-none bg-transparent p-0 focus-visible:ring-0 dark:bg-transparent",
        className
      )}
    />
  )
}
