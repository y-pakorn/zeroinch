import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import axios from "axios"
import { Address } from "viem"

export const useMarketPrice = ({
  queryOptions,
}: {
  queryOptions?: Partial<UseQueryOptions<Record<Address, number>>>
} = {}) => {
  return useQuery({
    queryKey: ["market-price"],
    queryFn: async () => {
      const url = `/api/market-price`
      const { data } = await axios.get(url)
      return data
    },
    staleTime: 1000 * 3, // 3 seconds
    ...queryOptions,
  })
}
