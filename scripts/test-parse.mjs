import assert from 'node:assert/strict'
import { parseTicket, findDrawDate } from '../src/lib/parseTicket.js'
import { checkCombination, gameById, matchGame } from '../src/lib/games.js'

let passed = 0
let failed = 0

function check(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`ok   ${name}`)
  } catch (error) {
    failed += 1
    console.log(`FAIL ${name}`)
    console.log(`     ${error.message}`)
  }
}

check('reads a Grand Lotto 6/55 ticket with A and B lines', () => {
  const text = [
    'PCSO - GRAND LOTTO 6/55',
    'Draw: Sat 06-Sep-26 - 9:00 PM',
    'A: 07-14-23-31-42-49',
    'B: LP 02-11-19-28-33-51',
    'Draws played: 1',
    'Amount: 48.00',
    'Ticket No. 1234-5678-9012',
  ].join('\n')

  const ticket = parseTicket(text)
  assert.equal(ticket.category, '6-55-lotto')
  assert.equal(ticket.drawDate, '2026-09-06')
  assert.equal(ticket.combinations.length, 2)
  assert.deepEqual(ticket.combinations[0], { label: 'A', numbers: [7, 14, 23, 31, 42, 49] })
  assert.deepEqual(ticket.combinations[1], { label: 'B', numbers: [2, 11, 19, 28, 33, 51] })
  assert.deepEqual(ticket.notes, [])
})

check('does not read the ticket serial as combinations', () => {
  const text = 'TICKET NO. 1234-5678-9012\nTERMINAL 0001'
  const ticket = parseTicket(text)
  assert.equal(ticket.combinations.length, 0)
})

check('only reads combinations with a colon-suffixed A/B/C/D label', () => {
  const text = [
    'PCSO MEGALOTTO 6/45',
    'Draw Date: 16-Oct-26',
    'C. 08-22-19-10-35-27',
    'D 08-22-19-10-35-27',
  ].join('\n')
  const ticket = parseTicket(text)
  assert.equal(ticket.category, '6-45-lotto')
  assert.equal(ticket.drawDate, '2026-10-16')
  assert.deepEqual(ticket.combinations, [])
})

check('reads four labelled combinations and stops at the cap', () => {
  const text = [
    'ULTRA LOTTO 6/58',
    'A: 01-02-03-04-05-06',
    'B: 07-08-09-10-11-12',
    'C: 13-14-15-16-17-18',
    'D: 19-20-21-22-23-24',
    'E: 25-26-27-28-29-30',
  ].join('\n')
  const ticket = parseTicket(text)
  assert.equal(ticket.category, '6-58-lotto')
  assert.equal(ticket.combinations.length, 4)
  assert.deepEqual(
    ticket.combinations.map((combo) => combo.label),
    ['A', 'B', 'C', 'D'],
  )
})

check('ignores unlabelled lines of six numbers', () => {
  const text = ['SUPERLOTTO 6/49', '13-42-11-37-01-20'].join('\n')
  const ticket = parseTicket(text)
  assert.equal(ticket.category, '6-49-lotto')
  assert.deepEqual(ticket.combinations, [])
})

check('reads only the accepted draw date shapes', () => {
  assert.equal(findDrawDate('Fri 25-Sep-26'), '2026-09-25')
  assert.equal(findDrawDate('Fr 25-Sep-26'), '2026-09-25')
  assert.equal(findDrawDate('F 25-Sep-26'), '2026-09-25')
  assert.equal(findDrawDate('25-Sep-26'), '2026-09-25')
  assert.equal(findDrawDate('25-S-26'), '2026-09-25')

  assert.equal(findDrawDate('Draw 09-Sep-26'), '2026-09-09')
  assert.equal(findDrawDate('Draw J000456 NeD 09-Sep-26'), '2026-09-09')
  assert.equal(findDrawDate('Draw 0000456 WED 09-Sep-26'), '2026-09-09')
  assert.equal(findDrawDate('Dr 0000456 W 09-Sep-26'), '2026-09-09')

  assert.equal(findDrawDate('2026-10-18'), null)
  assert.equal(findDrawDate('10/18/2026'), null)
  assert.equal(findDrawDate('18 Oct 2026'), null)
  assert.equal(findDrawDate('OCT 18, 2026'), null)
  assert.equal(findDrawDate('no date here'), null)
})

check('reads PCSO ticket with Draw 0000457 and A:, B:, C:, D: combinations', () => {
  const text = [
    'PCSO LOTTO 6/42',
    'Draw 0000457 TUE 08-Sep-28',
    'A:09 19 24 27 43 33',
    'B: 02 11 18 25 36 41',
    'C:05 14 22 31 39 40',
    'D: 08 17 23 29 35 42',
  ].join('\n')
  const ticket = parseTicket(text)
  assert.equal(ticket.category, '6-42-lotto')
  assert.equal(ticket.drawDate, '2028-09-08')
  assert.equal(ticket.combinations.length, 4)
  assert.deepEqual(ticket.combinations[0], { label: 'A', numbers: [9, 19, 24, 27, 43, 33] })
  assert.deepEqual(ticket.combinations[1], { label: 'B', numbers: [2, 11, 18, 25, 36, 41] })
  assert.deepEqual(ticket.combinations[2], { label: 'C', numbers: [5, 14, 22, 31, 39, 40] })
  assert.deepEqual(ticket.combinations[3], { label: 'D', numbers: [8, 17, 23, 29, 35, 42] })
  assert.deepEqual(ticket.notes, [])
})

check('rejects an impossible date', () => {
  assert.equal(findDrawDate('02/30/2026'), null)
})

check('flags an unreadable game and date', () => {
  const ticket = parseTicket('some blurry text 1 2 3')
  assert.equal(ticket.category, null)
  assert.equal(ticket.drawDate, null)
  assert.equal(ticket.combinations.length, 0)
  assert.equal(ticket.notes.length, 3)
})

check('matches game type from 6/42, 6/45, 6/49, 6/55, and 6/58', () => {
  assert.equal(matchGame('6/42')?.id, '6-42-lotto')
  assert.equal(matchGame('6/45')?.id, '6-45-lotto')
  assert.equal(matchGame('6/49')?.id, '6-49-lotto')
  assert.equal(matchGame('6/55')?.id, '6-55-lotto')
  assert.equal(matchGame('6/58')?.id, '6-58-lotto')

  // Variations with spaces, dashes, colons
  assert.equal(matchGame('LOTTO 6/42')?.id, '6-42-lotto')
  assert.equal(matchGame('MEGALOTTO 6/45')?.id, '6-45-lotto')
  assert.equal(matchGame('SUPER LOTTO 6/49')?.id, '6-49-lotto')
  assert.equal(matchGame('GRAND LOTTO 6/55')?.id, '6-55-lotto')
  assert.equal(matchGame('ULTRA LOTTO 6/58')?.id, '6-58-lotto')
  assert.equal(matchGame('6-45')?.id, '6-45-lotto')
  assert.equal(matchGame('6 / 49')?.id, '6-49-lotto')
})

check('validates a combination against its game', () => {
  const game = gameById('6-58-lotto')
  assert.deepEqual(checkCombination([1, 2, 3, 4, 5, 6], game), [])
  assert.ok(checkCombination([1, 2, 3, 4, 5], game).some((issue) => issue.includes('6 numbers')))
  assert.ok(checkCombination([1, 2, 3, 4, 5, 99], game).some((issue) => issue.includes('1 to 58')))
  assert.ok(checkCombination([1, 1, 3, 4, 5, 6], game).some((issue) => issue.includes('repeat')))
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
