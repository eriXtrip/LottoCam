const STORAGE_KEY = 'lottocam.tickets.v1'

export function loadTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTickets(tickets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
    return true
  } catch {
    return false
  }
}

let counter = 0

export function createTicketId() {
  counter += 1
  return `${Date.now().toString(36)}-${counter.toString(36)}`
}
