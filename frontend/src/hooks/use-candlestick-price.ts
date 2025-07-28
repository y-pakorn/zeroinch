import { QueryOptions, useQuery, UseQueryOptions } from "@tanstack/react-query"
import axios from "axios"
import { Address } from "viem"

export interface ICandlestickPrice {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export const useCandlestickPrice = ({
  base,
  quote,
  interval = 900,
  queryOptions,
}: {
  base: Address
  quote: Address
  interval?: 300 | 900 | 3600
  queryOptions?: Partial<UseQueryOptions<ICandlestickPrice[]>>
}) => {
  return useQuery({
    queryKey: ["candlestick-price", base, quote, interval],
    queryFn: async () => {
      const url = `/api/candlestick?base=${base}&quote=${quote}&interval=${interval}`
      const { data } = await axios.get(url)
      return data
    },
    staleTime: 1000 * 60, // 1 minute
    ...queryOptions,
  })
}
