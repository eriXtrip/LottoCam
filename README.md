# LottoCam

Read a PCSO Major Jackpot ticket with your camera, confirm the printed numbers, and check them
against the live draw.

LottoCam is camera-first: it photographs a ticket, reads the game, draw date, and up to four
combinations, drops them into editable fields, and then checks each combination against the
published result. OCR runs in the browser, so ticket images never leave the device.

Scope for now is the Major Jackpot (pari-mutuel) games only: 6/42, 6/45, 6/49, 6/55, and 6/58.

## Stack

- React 19 + Vite, deployed on Vercel.
- `tesseract.js` for in-browser OCR.
- Results from [LottoResulta](https://lottoresulta.com/api-docs): a free, CORS-open, independent
  aggregator. Proportional reporting, not official. It is not affiliated with PCSO.

## Getting started

```bash
npm install
npm run dev
```

Open the printed URL. Allow camera access, or use "Choose a photo" / drag a ticket image onto the
drop area.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server. Calls LottoResulta directly (open CORS). |
| `npm run build` | Production build into `dist/`. |
| `npm run preview` | Serve the built output locally. |
| `npm run test:parse` | Run the ticket parser against sample OCR text in Node. |

## How a scan becomes data

1. **Capture.** `CapturePanel` grabs a frame from the camera or takes an uploaded image.
2. **Clean.** `src/lib/ocr.js` scales the image, converts to grayscale, and stretches the contrast so
   the thermal print separates from the paper.
3. **Read.** Tesseract runs with a character whitelist limited to upper case, digits, and separators.
4. **Parse.** `src/lib/parseTicket.js` is a pure function that turns the raw text into
   `{ category, drawDate, combinations }`. It looks for a labelled line per combination (`A. 07-14`,
   `B. LP 02-11`), falls back to unlabelled lines of exactly six numbers, and refuses to mistake a
   ticket serial (`1234-5678-9012`) for a combination.
5. **Confirm.** Everything lands in editable fields. OCR is never trusted as final, so the user
   fixes it and the check runs only when the numbers are valid for the chosen game.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import it at vercel.com. Vercel detects Vite; the build command is `npm run build` and the output
   directory is `dist`.
3. The `api/` folder becomes serverless functions automatically. The client talks to
   `/api/latest` and `/api/check`, which proxy LottoResulta (`api/latest.js`, `api/check.js`) and add
   caching. `vercel.json` rewrites every non-API path to `index.html` so client routes work.

No environment variables are required. If LottoResulta ever needs a key, add it in the proxy
functions and Vercel project settings.

## Limits and responsible use

- LottoCam is an independent tool, not affiliated with PCSO. Results are a reference; verify every
  combination at [pcso.gov.ph](https://www.pcso.gov.ph/SearchLottoResult.aspx) before claiming.
- The barcode on a PCSO ticket is proprietary to PCSO terminals. LottoCam reads the printed text, not
  the barcode, so a sharp photo matters.
- Saved tickets live in this browser's local storage only.
- Attribution to LottoResulta is required when you republish their data.

## Design

The visual direction lives in `DESIGN.md`. Agent notes and commands live in `AGENTS.md`.
