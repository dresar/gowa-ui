export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'kB', 'MB', 'GB']
  const power = Math.min(Math.floor(Math.log10(bytes) / 3), units.length - 1)
  const value = bytes / 1000 ** power
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[power]}`
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * True for missing/zero timestamps: gowa stores Go's zero time
 * (0001-01-01) on chat rows created from contact sync before any
 * message exists, and epoch 0 is equally meaningless to display.
 */
export function isZeroTime(iso: string | null | undefined): boolean {
  if (!iso) return true
  const millis = new Date(iso).getTime()
  return Number.isNaN(millis) || millis <= 0
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date)
}

const dayFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

/** Calendar date only, for metadata where the time of day adds nothing. */
export function formatDay(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dayFormat.format(date)
}

/** Formats a device label concisely, abbreviating long UUIDs to 'xxxx...xxxx'. */
export function formatDeviceLabel(
  device?: { id: string; display_name?: string } | null,
): string {
  if (!device) return 'Device'
  if (device.display_name && device.display_name.trim().length > 0) {
    return device.display_name.trim()
  }
  const id = device.id
  if (id.length > 13) {
    return `${id.slice(0, 4)}...${id.slice(-4)}`
  }
  return id
}
