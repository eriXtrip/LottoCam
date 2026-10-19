# LottoCam design direction

> Agent-authored proposal. Per antislop R-37 this is a proposal, not direction handed down by the
> owner. It exists so the build has a specific language instead of a sterile default. Any line can
> be overridden; if it is, update this file first.

## What this is

A camera-first utility for Filipino lotto players: photograph a PCSO Major Jackpot (pari-mutuel)
ticket, confirm the printed numbers in editable fields, and check them against the live draw. It is
a tool, not a casino. No confetti, no "win big" language.

## Design Read

Reading this as: a utility app for Filipino lotto players checking a ticket, in a printed-ticket /
ledger language, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

## Dials

- **ENERGY 2** — confident, calm. It states what it does and gets out of the way.
- **RHYTHM 2** — one system with deliberate breaks. The capture stage and the result stage do not
  look the same.
- **MOTION 1** — hover and focus states, one short reveal when extracted data appears, and one
  bounded 3s ripple over the frozen frame after a scan. No endless loops, no parallax.

## Identity motif: Minimalist Philippine National Palette

Clean, high-legibility minimalist utility built on the Philippine national flag and PCSO identity colors.
Razor-sharp, uncluttered cards, generous whitespace, crisp hairlines, and purposeful visual hierarchy.

## Palette

Minimalist, high-contrast, and clean.

| Token | Value | Role |
| --- | --- | --- |
| White / Canvas | `#ffffff` | Primary background, clean panels, input surfaces |
| White / Subtle | `#f8fafc` | Elevated card surfaces, soft contrast zones |
| Royal Blue | `#0038A8` | Brand anchor, header top-bar, primary navigation, focus rings, combination chips |
| National Red | `#CE1126` | Primary action ("Scan"), live draw indicators, high-contrast accents |
| Golden Yellow | `#FCD116` | Matched number highlights, winning cards, ticket guide corner markers |
| Ink | `#0f172a` | Deep slate primary text for maximum legibility |
| Soft Ink | `#64748b` | Clean slate secondary text |
| Line | `#e2e8f0` | Minimalist hairlines, card borders |
| Line Strong | `#cbd5e1` | Input borders, divider rules |

## Typography

- **Display & Headings: Public Sans.** Clean, modern, highly legible geometric sans-serif.
- **Body: Public Sans.** Neutral, crisp, and accessible.
- **Data: IBM Plex Mono**, tabular. Ticket numbers, draw dates, and amounts read with machine-precision.

Three roles, cleanly separated, maintaining a minimalist look without artificial clutter.

## Radius, shadow, motion

- **Radius**: small and deliberate. 3px on inputs and number cells, 6px on panels, 10px only on the
  camera panel, the one raised surface on the page. Not pill-shaped.
- **Shadow**: reserved for the capture surface and the result panel. Everything else sits flat.
- **Motion**: 120ms ease on hover and focus, one 200ms reveal when extracted fields populate, one
  3s scattered-ripple pass after the shutter. Nothing loops without an end.

## Layout

- Capture and review are one continuous slip: photograph, then the extracted numbers appear in the
  same panel, edited in place. The job is "did my ticket win", so capture and check are one act.
- Results read as the front page of the day's five draws, in draw order, not as a card grid.

## What to avoid here

- Dark-mode-by-default, blue-purple gradients, glassmorphism, glow, pill-shaped everything.
- Casino language: jackpot magic, confetti, coins, sparkles. The accent red is ink, not excitement.
- Invented statistics or testimonials. The app shows real draws or nothing.
