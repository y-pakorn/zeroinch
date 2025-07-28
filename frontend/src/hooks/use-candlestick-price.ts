import { QueryOptions, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Address } from "viem"

import { chain } from "@/config/chain"

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
  interval?: 300 | 900 | 3600 | 14400
  queryOptions?: QueryOptions<ICandlestickPrice[]>
}) => {
  return useQuery({
    queryKey: ["candlestick-price", base, quote],
    queryFn: async () => {
      const url = `/api/candlestick?base=${base}&quote=${quote}`
      const { data } = await axios.get(url)
      return data
    },
    ...queryOptions,
  })
}
