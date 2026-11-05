# Product Catalog Messenger Automation

Node.js + Vercel + Google Sheets CSV + Meta Messenger Webhook.
This starter version uses deterministic JavaScript keyword matching and fixed response templates. It does not require a paid AI API or a Local Ollama tunnel.

## 1. Requirements
- Node.js 20+
- A Meta Developer App with Messenger use case
- A Facebook Page you administer
- Google Sheet tab published/publicly viewable as CSV

## 2. Install
```powershell
npm install
```

## 3. Configure local environment
Copy `.env.example` to `.env` and fill in Meta values.
Do not commit `.env`.

The Google Sheet must allow `Anyone with the link` to view. If it contains private information, do not publish it; use Google Sheets API with service-account authentication instead.

## 4. Local test
```powershell
npm start
```
Test:
- http://localhost:3000/health
- http://localhost:3000/test-sheet
- http://localhost:3000/product/P011

POST `/process-message` with JSON:
```json
{ "message": "vai P011 er dam koto" }
```

## 5. Vercel deployment
Import this GitHub repository into Vercel.
Set these Environment Variables in Vercel:
- META_VERIFY_TOKEN
- META_PAGE_ACCESS_TOKEN
- META_PAGE_ID
- META_APP_SECRET
- GRAPH_API_VERSION
- SHEET_ID
- SHEET_GID

Redeploy after adding/changing environment variables.

## 6. Meta webhook
Callback URL: `https://YOUR-PROJECT.vercel.app/webhook`
Verify Token: exact value of `META_VERIFY_TOKEN`
Subscribe the Page webhook to the `messages` field.

## 7. FAQ editing
Edit `src/data/faqs.json`. Replace the placeholder replies with your real delivery, payment, return, exchange and order policies. Add common spelling variants to each `keywords` array.

## Important limitations
- Keyword matching is deterministic; it cannot reliably understand every typo or free-form Banglish sentence. Add variants to `faqs.json` as you observe them.
- Product Code extraction supports codes like P011.
- This starter handles text messages only.
- Vercel Hobby has usage limits and is not an unlimited commercial hosting plan. Confirm current plan terms before using for a shop.
- Meta messaging policies and permitted reply windows apply.
- In-memory duplicate protection is not persistent on serverless. For robust production deduplication, add a persistent store.
- Set META_APP_SECRET before production so webhook signatures are verified.
- Keep Page Access Token and App Secret secret.
