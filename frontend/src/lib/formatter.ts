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
  value: (value: number | string) => {
    return numbro(value).format({
      mantissa: 4,
      thousandSeparated: true,
      trimMantissa: true,
    })
  },
  usd: (value: number | string) => {
    return numbro(value).formatCurrency({
      mantissa: 2,
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
}
