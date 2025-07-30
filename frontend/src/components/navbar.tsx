import { ArrowDown, ArrowUp } from "lucide-react"

import { DepositWithdrawDialog } from "./deposit-withdraw-dialog"
import { InternalAccountButton } from "./internal-account-button"
import { Button } from "./ui/button"

export default function Navbar() {
  return (
    <nav className="flex items-center gap-2">
      <div className="text-xl font-semibold">ZeroInch</div>
      <div className="flex-1" />
      <InternalAccountButton />
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
