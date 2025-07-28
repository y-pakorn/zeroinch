import { deserialize, State } from "wagmi"

export function cookieToInitialState(
  k: string = "wagmi",
  cookie?: string | null
) {
  if (!cookie) return undefined
  const key = `${k}.store`
  const parsed = parseCookie(cookie, key)
  if (!parsed) return undefined
  return deserialize<{ state: State }>(parsed).state
}

export function parseCookie(cookie: string, key: string) {
  const keyValue = cookie.split("; ").find((x) => x.startsWith(`${key}=`))
  if (!keyValue) return undefined
  return keyValue.substring(key.length + 1)
}
