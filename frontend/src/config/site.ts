import { env } from "@/env.mjs"

export const siteConfig = {
  name: "ZeroInch",
  author: "ZeroInch",
  description: "Trade using 1inch's limit order protocol privately",
  keywords: ["1inch", "limit order", "private", "trade"],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "ZeroInch",
  },
  twitter: "",
  favicon: "/favicon.ico",
  ogImage: "",
}
