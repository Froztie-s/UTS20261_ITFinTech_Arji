# WEB_PaymentGateway

Ordering and payment app for a small food and drink shop. Customers pick items by category, review them at checkout, and pay with QRIS, a BCA virtual account or Indomaret through the **Midtrans** payment gateway. When the payment succeeds, Midtrans calls a webhook and the order is marked **LUNAS** automatically.

Built for UTS IT Financial Services (Semester Ganjil 2026-1).

## Stack

- Next.js (Pages Router) and React
- Tailwind CSS
- MongoDB Atlas with Mongoose
- Midtrans sandbox Core API (QRIS, BCA virtual account, Indomaret)

## Pages

| Route | Page |
| --- | --- |
| `/` | Select items: category tabs, search, add to cart |
| `/checkout` | Review items, change quantities, subtotal, tax and total |
| `/payment` | Choose a payment method (QRIS, BCA Virtual Account, Indomaret) and confirm |
| `/payment/[id]` | Order status. Shows the QR code (QRIS), the virtual account number (BCA) or the payment code (Indomaret) with a countdown, and flips to **LUNAS** by itself |

## Payment flow

1. The customer confirms on `/payment`. `POST /api/checkout` saves the order. Prices and tax are recalculated on the server from the database, never taken from the browser.
2. `POST /api/payment/create` charges the payment through the Midtrans Core API (QRIS, BCA virtual account or Indomaret). Each method has its own payment screen. The QR code is valid for 15 minutes, the BCA virtual account for 60 minutes and the Indomaret code for 2 hours.
3. The customer pays. Midtrans sends a notification to `POST /api/webhook/midtrans`.
4. The webhook checks the SHA512 signature and the amount, then sets the payment to LUNAS, EXPIRED or FAILED. Repeated notifications change nothing, and a paid order never goes backwards.
5. `/payment/[id]` polls `GET /api/payment/[id]` every 4 seconds and updates without a refresh.

## Database (MongoDB)

| Collection | Main fields |
| --- | --- |
| `products` | name, price, category, image, description, stock |
| `checkouts` | items (product, name, price, qty), subtotal, tax, total, customer email, paymentMethod, status (`pending` or `paid`) |
| `payments` | checkoutId, orderId (unique), amount, qrString, vaNumber, paymentCode, expiresAt, status (`PENDING`, `LUNAS`, `EXPIRED`, `FAILED`), paidAt, rawNotification |

## Getting started

```bash
npm install
# create a file named .env.local with the variables listed below
npm run seed                 # loads the 12 sample products
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | Atlas connection string, including the database name |
| `MIDTRANS_SERVER_KEY` | Sandbox server key (Midtrans dashboard, Settings, Access Keys) |
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

- **QRIS:** choose QRIS and confirm. In sandbox the QR page shows a **QR image URL**. Copy it into the [Midtrans QRIS simulator](https://simulator.sandbox.midtrans.com/v2/qris/index) and press Simulate.
- **BCA Virtual Account:** copy the virtual account number into the [BCA VA simulator](https://simulator.sandbox.midtrans.com/bca/va/index), then inquire and pay.
- **Indomaret:** copy the payment code into the [Indomaret simulator](https://simulator.sandbox.midtrans.com/indomaret/phoenix/index), then inquire and pay.

In every case the order page switches to LUNAS by itself once the webhook arrives.

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
