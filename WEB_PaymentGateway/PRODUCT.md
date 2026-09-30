# Product

## Register

product

## Users
Customers ordering food and drinks, mostly on a phone, often hungry and in a hurry. They want to find something, add it, pay, and see confirmation with no detours. A secondary audience is the course lecturer, who walks through select items, checkout and payment status.

## Product Purpose
A small ordering and payment flow: choose items by category (Food, Drink, Snack), review them at checkout, pay through the Midtrans payment gateway, and see the order flip to LUNAS automatically when the webhook arrives. Success is a customer completing an order in a few taps and trusting that the status shown is real.

## Brand Personality
Friendly, appetizing, efficient. Warm and inviting like a food delivery app, but the interface stays out of the way: one clear action per screen, large food photos, rounded white cards, a single warm orange accent.

## Anti-references
- Dark mode, neon, glassmorphism, gradient text.
- Dense enterprise dashboards and data-table looks.
- Generic SaaS card grids with icon, heading and text repeated.
- Decorative motion that does not convey state.

## Design Principles
1. **One action per screen.** Each page has a single obvious next step (Add, Checkout, Pay).
2. **Food first.** Photography and price lead; chrome and labels recede.
3. **Status is honest.** Payment states (pending, LUNAS, expired, failed) are always visible and never guessed.
4. **Familiar over clever.** Standard mobile shop patterns (category chips, stepper, sticky cart bar) beat invented ones.
5. **Mobile first, desktop graceful.** Designed at phone width, then widened for larger screens.

## Accessibility & Inclusion
Aim for WCAG AA contrast, including white text on the orange buttons (pick a darker orange where needed). Primary buttons at least 44px tall; compact steppers and row buttons at least 36px. Any animation has a reduced-motion fallback. Status is never conveyed by color alone.
