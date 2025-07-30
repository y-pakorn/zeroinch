import { env } from "@/env.mjs"

export const siteConfig = {
  name: "zeroinch",
  author: "zeroinch",
  description:
    "Trade using 1inch's limit order protocol privately using zeroinch!",
  keywords: ["1inch", "limit order", "private", "trade"],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "ZeroInch",
  },
  twitter: "",
  favicon: "/favicon.ico",
  ogImage: "",
}
