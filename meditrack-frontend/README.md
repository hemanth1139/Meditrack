## MediTrack Frontend

Full **Next.js 14** (App Router) frontend for MediTrack.

### Setup

```bash
cd meditrack-frontend
npm install
```

### Environment

Copy `.env.local.example` to `.env.local` if you want to override API URL (default is `http://localhost:8000/api` in `lib/api.js`):

```bash
copy .env.local.example .env.local
```

### Run

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### Backend connection

Backend must be running at `http://localhost:8000`.

### Pages / Routes

- `/login`
- `/register`
- `/dashboard/patient/dashboard`
- `/dashboard/patient/records`
- `/dashboard/patient/qr-code`
- `/dashboard/doctor/dashboard`
- `/dashboard/doctor/patients`
- `/dashboard/doctor/patients/[patientId]`
- `/dashboard/doctor/approvals`
- `/dashboard/doctor/records/new`
- `/dashboard/staff/dashboard`
- `/dashboard/staff/patients/new`
- `/dashboard/staff/records/new`
- `/dashboard/admin/dashboard`
- `/dashboard/admin/hospitals`
- `/dashboard/admin/doctors`
- `/dashboard/admin/users`
- `/dashboard/admin/audit-logs`
- `/dashboard/admin/integrity`

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
