import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import numbro from "numbro"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(duration)

export const formatter = {
  timeShort: (value: number) => {
    return dayjs
      .utc(value * 1000)
      .local()
      .format("D/M H:mm")
  },
  timeRelative: (value: number) => {
    return dayjs
      .utc(value * 1000)
      .local()
      .fromNow()
  },
  valueReadable: (value: number | string) => {
    return numbro(value).format({
      mantissa: 2,
      thousandSeparated: true,
      trimMantissa: true,
      optionalMantissa: true,
      lowPrecision: false,
      average: true,
    })
  },
  value: (value: number | string, decimals?: number) => {
    return numbro(value).format({
      mantissa: decimals ?? 4,
      thousandSeparated: true,
      trimMantissa: true,
    })
  },
  usd: (value: number | string, decimals?: number) => {
    return numbro(value).formatCurrency({
      mantissa: decimals ?? 2,
      thousandSeparated: true,
      trimMantissa: true,
      optionalMantissa: true,
      currencySymbol: "$",
      currencyPosition: "prefix",
    })
  },
  usdReadable: (value: number | string) => {
    return numbro(value).formatCurrency({
      mantissa: 2,
      thousandSeparated: true,
      trimMantissa: true,
      currencySymbol: "$",
      currencyPosition: "prefix",
      average: true,
      lowPrecision: false,
    })
  },
  valueLocale: (value: number | string) => {
    return value.toLocaleString()
  },
  duration: (time: number, unit?: duration.DurationUnitType) => {
    return dayjs.duration(time, unit).humanize()
  },
  percentage: (value: number, decimals?: number) => {
    return numbro(value).format({
      mantissa: decimals ?? 2,
      thousandSeparated: true,
      trimMantissa: true,
      optionalMantissa: true,
      output: "percent",
      forceSign: true,
    })
  },
  decimals: (value: number) => {
    if (value < 0.0001) return 10
    if (value < 0.001) return 8
    if (value < 0.01) return 6
    if (value < 10) return 4
    return 2
  },
  decimalsTight: (value: number) => {
    if (value < 0.0001) return 4
    if (value < 0.001) return 4
    if (value < 0.01) return 4
    if (value < 10) return 2
    return 2
  },
}
