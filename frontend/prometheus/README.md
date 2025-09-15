This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment configuration

Create `frontend/prometheus/.env.local` with:

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

On production, set `NEXT_PUBLIC_API_BASE` to your deployed backend URL, e.g.
`https://your-backend.onrender.com` or `https://your-backend.up.railway.app`.

## Screenshots

The following screenshots are available in the repository `assets/` folder and illustrate the UI:

![Landing Page](../../assets/Screenshot%202025-09-15%20134335.png)

![Agent Workflow and Logs](../../assets/Screenshot%202025-09-15%20134347.png)

![Pareto Front Visualization](../../assets/Screenshot%202025-09-15%20134403.png)

![Configuration Sidebar](../../assets/Screenshot%202025-09-15%20134441.png)

![Contact Page](../../assets/Screenshot%202025-09-15%20134518.png)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
