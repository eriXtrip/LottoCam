# LottoCam: agent notes

## Stack

- React 19 + Vite. Deployed on Vercel: static build in `dist/`, serverless functions in `api/`.
- OCR runs in the browser with tesseract.js. Ticket images never leave the device.
- Lotto results come from [LottoResulta](https://lottoresulta.com/api-docs), a free, CORS-open,
  independent aggregator. Attribution is required and it is not affiliated with PCSO.
  In dev the client calls LottoResulta directly. In production the client calls `/api/*`, a small
  proxy in front of upstream (adds caching, and gives one place to swap the source).

## Commands

- `npm run dev` local dev server
- `npm run build` production build to `dist/`
- `npm run preview` serve the built output
- `npm run test:parse` run the ticket parser against sample OCR text (node, no browser, no build)

## Rules

- Keep `src/lib/parseTicket.js` a pure function. It is the only place OCR text becomes ticket data.
- Add a game or result source only through `src/lib/games.js`.
- Every data view needs empty, loading, and error states.

<!-- antislop:start -->
## antislop

UI, copy, accessibility, mobile, and code-comment work follows the antislop system, installed
globally under `~/.agents/skills/` and `~/.config/opencode/skills/`: core `antislop`, plus
`antislop-ui`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, `antislop-code`.
Design direction is `DESIGN.md` (agent-authored proposal). Before any UI work, ask the user when
antislop applies: during the work, or after it is done.
<!-- antislop:end -->
