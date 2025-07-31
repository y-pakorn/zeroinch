import { ArrowDown, ArrowUp } from "lucide-react"

import { testCrypto } from "@/lib/crypto"

import { ConnectWalletButton } from "./connect-wallet-button"
import { DepositWithdrawDialog } from "./deposit-withdraw-dialog"
import { InternalAccountButton } from "./internal-account-button"
import { Button } from "./ui/button"

export default function Navbar() {
  return (
    <nav className="flex items-center gap-2">
      <div className="font-serif text-3xl font-medium">zeroinch</div>
      <div className="flex-1" />
      <Button onClick={testCrypto} size="sm">
        Test Crypto
      </Button>
      <ConnectWalletButton />
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
