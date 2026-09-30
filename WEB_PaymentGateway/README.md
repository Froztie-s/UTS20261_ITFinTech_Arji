# WEB_PaymentGateway

Ordering and payment app for a small food and drink shop. Customers pick items by category, review them at checkout, and pay with a card, QRIS, an e-wallet or bank transfer through the **Midtrans** payment gateway. When the payment succeeds, Midtrans calls a webhook and the order is marked **LUNAS** automatically.

Built for UTS IT Financial Services (Semester Ganjil 2026-1).

## Stack

- Next.js (Pages Router) and React
- Tailwind CSS
- MongoDB Atlas with Mongoose
- Midtrans sandbox: Snap (card, e-wallet, bank transfer) and Core API (QRIS)

## Pages

| Route | Page |
| --- | --- |
| `/` | Select items: category tabs, search, add to cart |
| `/checkout` | Review items, change quantities, subtotal, tax and total |
| `/payment` | Choose a payment method (Card, QRIS, Other) and confirm |
| `/payment/[id]` | Order status. Shows the QR code for QRIS, "Pay now" for other methods, and flips to **LUNAS** by itself |

## Payment flow

1. The customer confirms on `/payment`. `POST /api/checkout` saves the order. Prices and tax are recalculated on the server from the database, never taken from the browser.
2. `POST /api/payment/create` creates the payment at Midtrans.
   - QRIS: a Core API charge. The QR code is shown on our own page and stays valid for 15 minutes.
   - Card and Other: a Snap transaction, and the customer is redirected to the Midtrans payment page.
3. The customer pays. Midtrans sends a notification to `POST /api/webhook/midtrans`.
4. The webhook checks the SHA512 signature and the amount, then sets the payment to LUNAS, EXPIRED or FAILED. Repeated notifications change nothing, and a paid order never goes backwards.
5. `/payment/[id]` polls `GET /api/payment/[id]` every 4 seconds and updates without a refresh.

## Database (MongoDB)

| Collection | Main fields |
| --- | --- |
| `products` | name, price, category, image, description, stock |
| `checkouts` | items (product, name, price, qty), subtotal, tax, total, customer email, paymentMethod, status (`pending` or `paid`) |
| `payments` | checkoutId, orderId (unique), amount, snapToken, redirectUrl, qrString, expiresAt, status (`PENDING`, `LUNAS`, `EXPIRED`, `FAILED`), paidAt, rawNotification |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run seed                 # loads the 12 sample products
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | Atlas connection string, including the database name |
| `MIDTRANS_SERVER_KEY` | Sandbox server key (Midtrans dashboard, Settings, Access Keys) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Sandbox client key |
| `NEXT_PUBLIC_BASE_URL` | Public address of the app, used for the return link after paying |
| `MIDTRANS_IS_PRODUCTION` | Leave unset for sandbox |

`.env.local` is git-ignored. Never commit real keys.

## Webhook setup

Midtrans must be able to reach the app, so `localhost` will not work.

1. Get a public URL: your Vercel deployment, or `ngrok http 3000` while developing.
2. In the Midtrans sandbox dashboard open **Settings, Configuration** and set **Payment Notification URL** to:

```
https://<your-public-url>/api/webhook/midtrans
```

The endpoint answers `403` for a wrong signature, `400` for an amount mismatch, and `200` otherwise.

## Testing a payment

- **QRIS:** choose QRIS and confirm. In sandbox the QR page shows a **QR image URL**. Copy it into the [Midtrans QRIS simulator](https://simulator.sandbox.midtrans.com/v2/qris/index) and press Simulate. The page switches to LUNAS.
- **Card, e-wallet, bank transfer:** use the test credentials and simulators listed in the Midtrans sandbox documentation.

## Project structure

```
components/   shared UI (icons, stepper, thumbnail, form field, QRIS screen)
context/      cart state (saved in localStorage)
lib/          database connection, Midtrans client, pricing, helpers
models/       Product, Checkout, Payment
pages/        the four pages above
pages/api/    products, checkout, payment create and status, Midtrans webhook
scripts/      seed.js
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run seed` | Reset and reload the sample products |
| `npm run lint` | Run ESLint |
