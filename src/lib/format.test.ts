import { describe, expect, it } from 'vitest'
import { formatBytes, formatDay, formatDeviceLabel, isZeroTime } from './format'

describe('isZeroTime', () => {
  it('treats Go zero time, epoch 0, empty, and garbage as zero', () => {
    expect(isZeroTime('0001-01-01T00:00:00Z')).toBe(true)
    expect(isZeroTime('1970-01-01T00:00:00Z')).toBe(true)
    expect(isZeroTime('')).toBe(true)
    expect(isZeroTime(undefined)).toBe(true)
    expect(isZeroTime('not-a-date')).toBe(true)
  })

  it('accepts real timestamps', () => {
    expect(isZeroTime('2026-07-14T06:00:00Z')).toBe(false)
  })
})

describe('formatDay', () => {
  it('passes unparseable input through untouched', () => {
    expect(formatDay('not-a-date')).toBe('not-a-date')
  })

  it('drops the time of day', () => {
    expect(formatDay('2026-07-14T06:00:00Z')).not.toContain(':')
  })
})

describe('formatBytes', () => {
  it('formats zero and negatives as 0 B', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(-5)).toBe('0 B')
  })

  it('formats bytes without decimals when whole', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(2000)).toBe('2 kB')
  })

  it('scales into MB and GB', () => {
    expect(formatBytes(50_000_000)).toBe('50 MB')
    expect(formatBytes(2_500_000_000)).toBe('2.5 GB')
  })
})

describe('formatDeviceLabel', () => {
  it('returns Device when device is null or undefined', () => {
    expect(formatDeviceLabel(null)).toBe('Device')
    expect(formatDeviceLabel(undefined)).toBe('Device')
  })

  it('uses display_name if available', () => {
    expect(formatDeviceLabel({ id: '12345', display_name: 'Work Phone' })).toBe('Work Phone')
  })

  it('abbreviates long UUIDs to 4...4 characters', () => {
    expect(formatDeviceLabel({ id: '26883318-fd31-4109-b368-c293f76f3964' })).toBe('2688...3964')
  })

  it('keeps short IDs intact', () => {
    expect(formatDeviceLabel({ id: 'device-1' })).toBe('device-1')
  })
})
