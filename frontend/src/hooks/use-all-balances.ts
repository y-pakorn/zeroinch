import { useMemo } from "react"
import BigNumber from "bignumber.js"
import { Address, erc20Abi } from "viem"
import { useReadContracts } from "wagmi"

import { tokens } from "@/config/token"

export const useAllBalances = ({ address }: { address: Address }) => {
  const tokenList = useMemo(() => Object.values(tokens), [])

  const { data, isLoading, error } = useReadContracts({
    contracts: tokenList.map((token) => ({
      address: token.address,
      functionName: "balanceOf",
      args: [address],
      abi: erc20Abi,
    })),
  })

  return {
    balances:
      data?.map((data, index) => ({
        raw: BigInt(data.result || 0n),
        decimals: tokenList[index].decimals,
        float: BigNumber(data.result || 0)
          .shiftedBy(-tokenList[index].decimals)
          .toNumber(),
      })) || [],
    isLoading,
    error,
  }
}
