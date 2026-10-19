const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

const drawDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatPeso(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null
  return peso.format(amount)
}

export function formatDrawDate(iso) {
  if (!iso) return null
  const parsed = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return drawDate.format(parsed)
}

const STATUS_LABELS = {
  verified: 'Verified',
  live: 'Live',
  live_complete: 'Live',
  conflict: 'Under review',
  scheduled: 'Scheduled',
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? 'Unconfirmed'
}

const SESSION_LABELS = {
  '2pm': '2:00 PM',
  '5pm': '5:00 PM',
  '9pm': '9:00 PM',
}

export function sessionLabel(session) {
  return SESSION_LABELS[session] ?? session ?? ''
}
