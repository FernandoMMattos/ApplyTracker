# ApplyTrack

A full-stack job application tracker with AI-powered insights — built to production standards.

## Tech Stack

| Layer      | Technology                                                           |
| ---------- | -------------------------------------------------------------------- |
| Framework  | Next.js 14 (App Router, TypeScript)                                  |
| API        | tRPC v11 (end-to-end type safety)                                    |
| Database   | PostgreSQL (AWS RDS) via Prisma ORM                                  |
| Auth       | NextAuth v5 (Google + GitHub OAuth)                                  |
| AI         | Claude API (Anthropic) — job parsing, fit score, cover letter drafts |
| UI         | shadcn/ui + Tailwind CSS v4                                          |
| Charts     | Recharts                                                             |
| Deployment | AWS ECS Fargate + RDS + S3 + CloudFront                              |
| CI/CD      | GitHub Actions                                                       |

## Features

- Track job applications through a full status pipeline (Saved → Applied → Interview → Offer)
- AI analysis: paste a job URL and Claude parses the description, scores your fit, and drafts a cover letter
- Dashboard with charts: applications over time, pipeline funnel, response rate
- Filter, search, and export applications to CSV (stored in S3)
- Dark mode + responsive mobile layout

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or [Neon](https://neon.tech) for dev)
- Anthropic API key

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Vitest unit tests
npm run db:migrate   # Run Prisma migrations
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```text
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Auth routes (sign-in, sign-up)
│   └── (dashboard)/      # Protected app routes
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Shell, nav, sidebar
│   ├── forms/            # Feature-specific forms
│   └── charts/           # Dashboard charts
├── server/
│   ├── actions/          # Next.js Server Actions
│   └── queries/          # tRPC query procedures
├── lib/
│   ├── auth/             # NextAuth config
│   ├── db/               # Prisma client singleton
│   └── validations/      # Zod schemas
├── hooks/                # Custom React hooks
└── types/                # Shared TypeScript types
```

## Deployment

The app is containerized with Docker and deployed to AWS ECS Fargate. See [infra/](./infra) for the AWS CDK stack.

## License

MIT
