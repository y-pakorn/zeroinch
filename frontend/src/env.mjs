import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_GA_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_PROJECT_ID: z.string().min(1),
  },
  server: {
    ONEINCH_API_KEY: z.string().min(1),
    RELAYER_PRIVATE_KEY: z.string().min(1),
    RELAYER_RPC_URL: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
    ONEINCH_API_KEY: process.env.ONEINCH_API_KEY,
    RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY,
    RELAYER_RPC_URL: process.env.RELAYER_RPC_URL,
  },
})
