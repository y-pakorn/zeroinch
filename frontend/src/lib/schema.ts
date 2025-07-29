import { Address } from "viem"
import { z } from "zod"

export const placeOrderFormSchema = z.object({
  type: z.enum(["limit", "twap"]),
  baseTokenA: z.custom<Address>(
    (val) => typeof val === "string" && /^0x[a-fA-F0-9]{40}$/.test(val),
    { message: "Invalid Ethereum address" }
  ),
  baseTokenAmount: z.number().gt(0, "Base token amount must be greater than 0"),
  quoteTokenA: z.custom<Address>(
    (val) => typeof val === "string" && /^0x[a-fA-F0-9]{40}$/.test(val),
    { message: "Invalid Ethereum address" }
  ),
  quoteTokenAmount: z
    .number()
    .gt(0, "Quote token amount must be greater than 0"),
  selectedInterval: z.union([z.literal(300), z.literal(900), z.literal(3600)]),
  diffPercentage: z.number(),
  inversed: z.boolean(),
  expiry: z.number().positive("Expiry must be positive"),
  numberOfParts: z
    .number()
    .int()
    .min(2, "Must have at least 2 parts")
    .max(100, "Cannot exceed 100 parts"),
})

export type PlaceOrderFormData = z.infer<typeof placeOrderFormSchema>
