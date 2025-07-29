import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react"

import { useAccountStore } from "@/stores/account"

import { DepositWithdrawDialog } from "./deposit-withdraw-dialog"
import { Button } from "./ui/button"

export default function Navbar() {
  const {
    account: { seed },
  } = useAccountStore()

  const [rendered, setRendered] = useState(false)
  useEffect(() => {
    setRendered(true)
  }, [])

  return (
    <nav className="flex items-center gap-2">
      <div className="text-xl font-semibold">ZeroInch</div>
      <div className="flex-1" />
      <Button variant="outline" size="sm">
        Internal Account{" "}
        {rendered ? (
          <>
            <span className="text-muted-foreground">{seed.slice(0, 8)}</span>
            <div className="size-2 rounded-full bg-green-400" />
          </>
        ) : (
          <Loader2 className="animate-spin" />
        )}
      </Button>
      <DepositWithdrawDialog type="deposit">
        <Button variant="outline" size="sm">
          Deposit <ArrowDown />
        </Button>
      </DepositWithdrawDialog>
      <DepositWithdrawDialog type="withdraw">
        <Button variant="outline" size="sm">
          Withdraw <ArrowUp />
        </Button>
      </DepositWithdrawDialog>
    </nav>
  )
}
