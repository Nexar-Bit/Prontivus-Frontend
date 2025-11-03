# Testing Guide

This document explains how to run end-to-end (E2E) and accessibility tests for the modernized patient portal, plus basic performance checks.

## Prerequisites

- Node.js and npm installed
- Dev server running at http://localhost:3000 (or set E2E_BASE_URL)
- Feature flags enabled in `.env.local` for v2 views:

```
NEXT_PUBLIC_FEATURE_NEW_MOBILE_NAV=1
NEXT_PUBLIC_FEATURE_NEW_PORTAL_DASHBOARD=1
NEXT_PUBLIC_FEATURE_APPOINTMENTS_V2=1
NEXT_PUBLIC_FEATURE_RECORDS_V2=1
NEXT_PUBLIC_FEATURE_MESSAGES_V2=1
NEXT_PUBLIC_FEATURE_PRESCRIPTIONS_V2=1
```

## Install test dependencies

From `frontend/`:

```
npm i -D @playwright/test @axe-core/playwright
npx playwright install
```

## Run the tests

- All tests:

```
npx playwright test
```

- Headed mode / single spec:

```
npx playwright test tests/e2e/appointments.spec.ts --headed
```

- Set base URL (optional):

```
E2E_BASE_URL=http://localhost:3000 npx playwright test
```

## What the tests cover

- Functional (E2E)
  - Appointments v2: page load, booking sheet opens
  - Records v2: page load, search interaction
  - Emergency access: emergency button visible on portal

- Accessibility (axe)
  - `/portal` and `/portal/appointments` scanned against WCAG 2.1 A/AA

Add more routes by extending the specs in `tests/e2e`.

## Performance checks (lightweight)

- Trace viewer (built into Playwright):

```
npx playwright test --trace on
npx playwright show-trace test-results/**/trace.zip
```

- Quick Lighthouse pass (manual):
  - Open Chrome DevTools > Lighthouse on `/portal` and `/portal/appointments`
  - Track LCP, CLS, TBT, and accessibility scores

## Troubleshooting

- If v2 pages don’t render, confirm flags in `.env.local` and restart the dev server.
- If accessibility tests fail, see the JSON dump in the assertion message for failing nodes and rules.
- For mobile-specific UI (tab bar, emergency button), run with the Mobile Chrome project or use DevTools device emulation.


