# GoMAil — Plan. Deliver. Observe.

> **Production-grade, distributed email orchestration platform built from scratch.**  
> Plan campaigns with transactional outbox guarantees, deliver with BullMQ queue concurrency & rate limits, and observe every event with real PostgreSQL timestamps and metrics.

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Directory Structure](#directory-structure)
3. [Environment Configuration (Single `.env`)](#environment-configuration-single-env)
4. [System Architecture Diagram](#system-architecture-diagram)
5. [Database Entity Relationship Diagram (ERD)](#database-entity-relationship-diagram-erd)
6. [Campaign State Machine Diagram](#campaign-state-machine-diagram)
7. [Email Delivery Pipeline Sequence Diagram](#email-delivery-pipeline-sequence-diagram)
8. [Google OIDC Authentication Sequence Diagram](#google-oidc-authentication-sequence-diagram)
9. [Multi-Tenant RBAC Hierarchy & Permissions](#multi-tenant-rbac-hierarchy--permissions)
10. [CSV Power Suite & Contact Management](#csv-power-suite--contact-management)
11. [Quickstart & Development Commands](#quickstart--development-commands)
12. [API Endpoint Reference](#api-endpoint-reference)
13. [Operational Health, Observability & Recovery](#operational-health-observability--recovery)

---

## Architectural Overview

GoMAil eliminates the gap between user intent and distributed email delivery. It adheres to the following principles:

- **Strict Multi-Tenancy & RBAC:** Every user belongs to an `Organization` with scoped roles (`OWNER`, `ADMIN`, `OPERATOR`, `MEMBER`, `VIEWER`). Tenant isolation is enforced at the database query level.
- **Transactional Outbox Pattern:** Campaigns and recipient states are written to PostgreSQL inside transactions together with `OutboxEvent` records. No job is lost if a process crashes before enqueuing to Redis.
- **BullMQ Distributed Queue Engine:** High-throughput job distribution powered by Redis with atomic queue leases, exponential backoff, and strict hourly rate limiters.
- **Strict Idempotency:** Every delivery job uses a deterministic `SHA-256(campaignId:normalizedEmail)` key preventing double-sends across retries, reboots, and network flakes.
- **Pure Truth Observability:** Every dashboard statistic, timeline event, and latency metric is computed directly from concrete `DeliveryEvent` records. No fabricated mock data.

---

## Directory Structure

The repository is organized strictly into **`backend`** and **`frontend`** modules, with a single **`.env`** file placed securely inside `backend/` and protected by `.gitignore` against git leaks:

```text
GoMAil/
├── .env.example          # Environment template and reference
├── .gitignore            # Airtight leak protection for all .env files
├── package.json          # Root orchestration & npm workspaces manifest
├── package-lock.json     # Deterministic dependency tree lockfile
├── tsconfig.base.json    # Shared TypeScript compiler options
├── README.md             # Consolidated system documentation & UML specifications
│
├── backend/              # Express REST API, BullMQ Worker, Prisma ORM, Mail Engine
│   ├── .env              # The ONE active environment file (git-ignored)
│   ├── prisma/
│   │   └── schema.prisma # PostgreSQL Prisma schema (Supabase)
│   ├── src/
│   │   ├── config/       # Environment loading & validation (Zod)
│   │   ├── lib/          # Prisma, Redis, BullMQ, Outbox, OAuth, Audit, Idempotency
│   │   ├── middleware/   # Auth session, RBAC permissions, Error handler, Request ID
│   │   ├── providers/    # Mail provider interface & Ethereal SMTP transport
│   │   ├── routes/       # Express routes (auth, campaigns, recipients, senders, etc.)
│   │   ├── services/     # Campaign state machine & business orchestration logic
│   │   ├── shared/       # Domain types, role permissions, queue constants
│   │   └── worker/       # BullMQ consumer, delivery processor, crash recovery
│   ├── package.json      # Backend dependencies & executable scripts
│   └── tsconfig.json     # Backend TypeScript configuration
│
└── frontend/             # Next.js 16 App Router, React 19, Tailwind CSS, TanStack Query
    ├── public/           # Static web assets and icons
    ├── src/
    │   ├── app/          # Next.js App Router pages (landing, login, dashboard, campaigns)
    │   │   ├── app/      # Authenticated application shell & sub-views
    │   │   ├── login/    # Google OAuth Sign-in interface
    │   │   ├── globals.css # Curated dark-slate design system & CSS variables
    │   │   ├── layout.tsx  # Root HTML layout & toast container
    │   │   └── page.tsx    # Plan. Deliver. Observe. landing page
    │   ├── components/   # AppShell, AuthGuard, Providers, Navbars
    │   ├── hooks/        # useAuth session hook & permission helpers
    │   ├── lib/          # Type-safe API client (fetch wrapper with credentials)
    │   └── types/        # TypeScript type contracts & shared interfaces
    ├── next.config.ts    # Next.js config loading backend/.env
    ├── package.json      # Frontend dependencies & Next.js scripts
    └── tsconfig.json     # Frontend TypeScript configuration
```

---

## Environment Configuration (Single `backend/.env`)

All secret configuration resides in the single file `backend/.env` (which is explicitly ignored in `.gitignore` to prevent any repository leaks). Both the API and Worker load directly from this file:

```env
# ─── Application ────────────────────────────────────────────────
NODE_ENV=development
PORT=5000
API_PORT=5000
API_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# ─── Database (PostgreSQL) ───────────────────────────────────────
DATABASE_URL="postgresql://postgres:XXXXXXXXXXXXXXXXXXXXXXXX@your-db-host:5432/postgres?sslmode=require"

# ─── Redis (Serverless / TLS) ───────────────────────────────────
REDIS_URL="rediss://default:XXXXXXXXXXXXXXXXXXXXXXXX@your-redis-host.upstash.io:6379"

# ─── Session Security ───────────────────────────────────────────
SESSION_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SESSION_DURATION_DAYS=30

# ─── Google OAuth ────────────────────────────────────────────────
GOOGLE_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# ─── SMTP Mail Transport ─────────────────────────────────────────
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_SECURE=false
ETHEREAL_USER=XXXXXXXXXXXXXXXXXXXXXXXX@ethereal.email
ETHEREAL_PASS=XXXXXXXXXXXXXXXXXXXXXXXX
ETHEREAL_FROM="GoMAil <outreach@gomail.com>"
ETHEREAL_FROM_NAME=GoMAil
ETHEREAL_FROM_EMAIL=outreach@gomail.com

# ─── Worker & Dispatcher Tuning ─────────────────────────────────
WORKER_CONCURRENCY=5
WORKER_QUEUE_NAME=gomail:delivery
OUTBOX_POLL_INTERVAL_MS=1000
LEASE_TIMEOUT_MS=60000
MIN_EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200
RATE_LIMIT_GLOBAL_PER_HOUR=500
RATE_LIMIT_ORG_PER_HOUR=200
RATE_LIMIT_SENDER_PER_HOUR=100
```

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph Client ["Client Tier"]
        Browser["Modern Web Browser"]
    end

    subgraph FrontendTier ["Frontend (Port 3000)"]
        NextApp["Next.js 16 Web Application<br/>React 19 / TanStack Query"]
        AuthGuardComp["AuthGuard & AppShell"]
        ApiClient["Type-Safe API Client"]
    end

    subgraph BackendTier ["Backend API & Orchestration (Port 5000)"]
        ExpressApp["Express.js REST API"]
        AuthMid["Auth & RBAC Middleware"]
        CampaignSvc["Campaign Service<br/>(State Machine)"]
        OutboxPoller["Transactional Outbox<br/>Processor (1s interval)"]
    end

    subgraph WorkerTier ["Worker Pool Tier"]
        BullMQWorker["BullMQ Delivery Worker<br/>Concurrency: 5"]
        RecoverySvc["Crash Recovery Service<br/>Lease Expiration Detector"]
    end

    subgraph DataStoreTier ["Managed Infrastructure"]
        PostgresDB[("Supabase PostgreSQL<br/>Multi-Tenant DB")]
        RedisStore[("Upstash Redis (TLS)<br/>BullMQ Queues & Sessions")]
        SMTPProvider["Ethereal SMTP Provider<br/>Nodemailer Transport"]
        GoogleOIDC["Google Identity OIDC<br/>OAuth 2.0 PKCE Provider"]
    end

    Browser -->|HTTP / React UI| NextApp
    NextApp --> AuthGuardComp
    AuthGuardComp --> ApiClient
    ApiClient -->|REST API with Cookies| ExpressApp
    ExpressApp --> AuthMid
    AuthMid --> CampaignSvc
    CampaignSvc -->|ACID Transaction| PostgresDB
    OutboxPoller -->|Poll Pending Outbox Events| PostgresDB
    OutboxPoller -->|Enqueue Job with Deterministic ID| RedisStore
    BullMQWorker -->|Atomic Job Claim| RedisStore
    BullMQWorker -->|Lease Heartbeat & Status Updates| PostgresDB
    BullMQWorker -->|Dispatch Email| SMTPProvider
    RecoverySvc -->|Detect Orphaned Processing Jobs| PostgresDB
    ExpressApp -->|Validate & Exchange Code| GoogleOIDC
    ExpressApp -->|Session Store & State Nonce| RedisStore
```

---

## Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    Organization ||--o{ OrganizationMember : "has"
    Organization ||--o{ Campaign : "owns"
    Organization ||--o{ Contact : "manages"
    Organization ||--o{ Sender : "registers"
    Organization ||--o{ Template : "stores"
    Organization ||--o{ ApiKey : "issues"
    Organization ||--o{ Webhook : "configures"
    Organization ||--o{ AuditLog : "records"
    Organization ||--o{ Suppression : "maintains"

    User ||--o{ OrganizationMember : "participates"
    User ||--o{ OAuthIdentity : "authenticates"
    User ||--o{ Session : "holds"
    User ||--o{ AuditLog : "executes"

    Campaign ||--o{ CampaignRecipient : "targets"
    Campaign ||--o{ DeliveryJob : "dispatches"
    Campaign ||--o{ DeliveryEvent : "generates"
    Campaign ||--o{ OutboxEvent : "buffers"
    Campaign }o--|| Sender : "sent_from"

    CampaignRecipient ||--o| DeliveryJob : "corresponds"
    DeliveryJob ||--o{ DeliveryEvent : "logs"
    Template ||--o{ TemplateVersion : "versions"

    Organization {
        string id PK
        string name
        string slug UK
        string avatarUrl
        datetime createdAt
        datetime deletedAt
    }

    User {
        string id PK
        string email UK
        string name
        string avatarUrl
        datetime lastLoginAt
        datetime deactivatedAt
    }

    OAuthIdentity {
        string id PK
        string userId FK
        string provider
        string providerSub UK
        string email
    }

    OrganizationMember {
        string id PK
        string organizationId FK
        string userId FK
        string role
        datetime joinedAt
    }

    Campaign {
        string id PK
        string organizationId FK
        string senderId FK
        string name
        string status
        string deliveryMode
        int delayMs
        int totalRecipients
        int sentCount
        int failedCount
    }

    CampaignRecipient {
        string id PK
        string campaignId FK
        string email
        string status
        string idempotencyKey UK
    }

    DeliveryJob {
        string id PK
        string campaignId FK
        string recipientId FK
        string idempotencyKey UK
        string status
        int attempt
        datetime leaseExpiresAt
        datetime sentAt
    }

    DeliveryEvent {
        string id PK
        string campaignId FK
        string jobId FK
        string event
        datetime occurredAt
    }
```

---

## Campaign State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Campaign

    DRAFT --> READY : Set Subject, HTML & Sender
    DRAFT --> CANCELLED : Delete / Discard

    READY --> DRAFT : Modify Content
    READY --> RUNNING : Launch (Immediate Mode)
    READY --> SCHEDULED : Schedule Future Time
    READY --> CANCELLED : Cancel Campaign

    SCHEDULED --> RUNNING : Scheduled Time Arrived
    SCHEDULED --> PAUSED : Hold Before Start
    SCHEDULED --> CANCELLED : Abort Schedule

    RUNNING --> PAUSED : Operator Pauses Run
    PAUSED --> RUNNING : Operator Resumes Run
    PAUSED --> CANCELLED : Terminate While Paused

    RUNNING --> CANCELLED : Abort In-Flight Run
    RUNNING --> COMPLETED : All Recipients Processed
    RUNNING --> FAILED : Fatal Unrecoverable Error

    COMPLETED --> [*]
    CANCELLED --> [*]
    FAILED --> [*]
```

---

## Email Delivery Pipeline Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Frontend Operator
    participant API as Express API
    participant DB as Supabase PostgreSQL
    participant Outbox as Outbox Processor
    participant Redis as Upstash Redis (BullMQ)
    participant Worker as Delivery Worker
    participant SMTP as Ethereal SMTP Server

    User->>API: POST /api/v1/campaigns/:id/launch
    API->>DB: BEGIN Transaction
    API->>DB: Update Campaign (status = 'RUNNING')
    API->>DB: Update Recipients (status = 'PENDING')
    API->>DB: INSERT OutboxEvent (type = 'ENQUEUE_DELIVERY', jobId = SHA256)
    API->>DB: COMMIT Transaction
    API-->>User: 200 OK (Campaign Launched)

    loop Polling every 1000ms
        Outbox->>DB: SELECT OutboxEvent WHERE processedAt IS NULL
        Outbox->>Redis: Enqueue Job into 'gomail:delivery' (id = SHA256)
        Outbox->>DB: UPDATE OutboxEvent SET processedAt = NOW()
    end

    Redis->>Worker: Dispatch Job (Recipient ID & Idempotency Key)
    Worker->>DB: Check & Set DeliveryJob status = 'PROCESSING'<br/>(leaseExpiresAt = NOW + 60s)
    Worker->>Redis: Atomic Rate Limit Check (Hourly Org & Global limits)
    Worker->>SMTP: SMTP Send (Host, Port, TLS, Auth, Message Payload)
    SMTP-->>Worker: 250 OK (Message Queued / ID returned)

    Worker->>DB: BEGIN Transaction
    Worker->>DB: Update DeliveryJob (status = 'SENT', sentAt = NOW())
    Worker->>DB: Update CampaignRecipient (status = 'SENT')
    Worker->>DB: Increment Campaign sentCount
    Worker->>DB: INSERT DeliveryEvent (event = 'sent', timestamp = NOW())
    Worker->>DB: COMMIT Transaction
    Worker->>Redis: Acknowledge Job Completed
```

---

## Google OIDC Authentication Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Web as Next.js Web App
    participant API as Express API (/api/auth)
    participant Redis as Upstash Redis (State Store)
    participant Google as Google Identity Provider (OIDC)
    participant DB as Supabase PostgreSQL

    User->>Web: Click "Sign in with Google"
    Web->>API: GET /api/auth/google
    API->>API: Generate PKCE (code_verifier + code_challenge) + Nonce
    API->>Redis: SETEX oauth:state:{state} 900s (state, nonce, verifier)
    API-->>User: 302 Redirect to Google Consent Screen

    User->>Google: Authenticate & Authorize Access
    Google-->>User: 302 Redirect to /api/auth/google/callback?code=...&state=...
    User->>API: GET /api/auth/google/callback?code=...&state=...

    API->>Redis: GET & DEL oauth:state:{state} (Single-Use Token)
    API->>Google: POST /token (Exchange code + PKCE verifier)
    Google-->>API: 200 OK (ID Token + Access Token)
    API->>API: Verify ID Token Signature, Audience & Nonce

    API->>DB: Upsert User & OAuthIdentity
    API->>DB: Find or Auto-Create Default Organization & OWNER Membership
    API->>DB: Create User Session Record
    API-->>User: Set-Cookie: gomail_session (HttpOnly, SameSite=Lax)
    API-->>User: 302 Redirect to /app (Dashboard)

    User->>Web: GET /app (With gomail_session cookie)
    Web->>API: GET /api/v1/auth/me
    API-->>Web: User Profile, Active Organization, Permissions
    Web-->>User: Render Authenticated Operations Dashboard
```

---

## Multi-Tenant RBAC Hierarchy & Permissions

```mermaid
classDiagram
    class OrganizationRole {
        <<enumeration>>
        OWNER
        ADMIN
        OPERATOR
        MEMBER
        VIEWER
    }

    class Permissions {
        +campaign.read
        +campaign.create
        +campaign.update
        +campaign.launch
        +campaign.pause
        +campaign.resume
        +campaign.cancel
        +campaign.delete
        +contacts.read
        +contacts.manage
        +sender.read
        +sender.manage
        +template.read
        +template.manage
        +analytics.view
        +operations.view
        +activity.view
        +team.read
        +team.manage
        +settings.read
        +settings.manage
        +api_key.manage
        +webhook.manage
    }

    OrganizationRole <|-- OWNER : Full Administrative & Billing Control
    OrganizationRole <|-- ADMIN : All Permissions Except Billing
    OrganizationRole <|-- OPERATOR : Campaign Execution & Monitoring
    OrganizationRole <|-- MEMBER : Campaign & Template Authoring
    OrganizationRole <|-- VIEWER : Read-Only Dashboard & Analytics Access
```

| Role | Campaigns (CRUD) | Launch / Pause | Team & Roles | API Keys | Settings | Analytics & Audit |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **OWNER** | Full | Yes | Full | Full | Full | Full |
| **ADMIN** | Full | Yes | Full | Full | View Only | Full |
| **OPERATOR** | Read / Update | Yes | View Only | View Only | No | Full |
| **MEMBER** | Create / Edit | No | View Only | No | No | Read Only |
| **VIEWER** | Read Only | No | View Only | No | No | Read Only |

---

## CSV Power Suite & Contact Management

GoMAil includes a full-featured, enterprise-grade CSV ingestion and extraction engine designed for high-scale cold outreach and audience segmentation:

### 1. Interactive Drag-and-Drop Ingestion Dropzone
- Accessible directly inside both **Campaign Details (`/app/campaigns/:id`)** and **Organization Contacts (`/app/contacts`)**.
- Visual drag-and-drop state transitions with dashed active boundaries.
- Instant file metadata inspection displaying detected file size, total raw lines, and detected header attributes prior to transmission.

### 2. Intelligent Column Mapping Engine
- Automatically parses CSV headers on the client side and matches column aliases:
  - **Email (Required):** Matches `email`, `mail`, `e-mail`, `recipient_email`.
  - **First Name:** Matches `first_name`, `firstname`, `first`, `fname`.
  - **Last Name:** Matches `last_name`, `lastname`, `last`, `lname`, `surname`.
  - **Company:** Matches `company`, `org`, `organization`, `business`, `firm`.
- Full user override via dynamic dropdown selectors allowing any custom column name to be mapped directly to recipient attributes.

### 3. Pre-Upload RFC Validation Preview Table
- Validates the first rows of any uploaded CSV immediately inside the browser before hitting the server.
- Live validation pills flag syntactically valid RFC 5322 addresses (`Valid`) versus malformed or missing emails (`Invalid`).
- Provides pre-flight confidence, eliminating failed campaign launches due to malformed input files.

### 4. One-Click Sample CSV Templates
- Instant downloadable CSV templates with pre-configured headers:
  - `sample_recipients_template.csv`
  - `contacts_sample_template.csv`
- Eliminates formatting guesswork for operators and campaign managers.

### 5. High-Performance CSV Streaming Export
- **Campaign Recipients Export (`GET /api/v1/campaigns/:id/recipients/export`):** Streams all campaign recipients with live delivery statuses (`PENDING`, `SCHEDULED`, `SENT`, `FAILED`, `SUPPRESSED`), failure error messages, and execution timestamps.
- **Organization Contacts Export (`GET /api/v1/contacts/export`):** Exports the entire organizational address book as a consolidated CSV file with associated tags.

### 6. Clean Viewport & Distraction-Free UI
- Streamlined interface with the removal of background developer widgets (TanStack Query floating buttons and Next.js dev activity indicators) to provide a 100% polished, production-ready workspace.

---

## Quickstart & Development Commands

### 1. Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x+ (comes with Node.js)
- Credentials configured in `backend/.env`

### 2. Dependency Installation
```bash
# Install all workspace dependencies across backend and frontend
npm install
```

### 3. Database Migration
```bash
# Synchronize Prisma schema with PostgreSQL database
npm run db:push
```

### 4. Running the Development Stack
You can run all components concurrently from the project root or run them independently:

```bash
# Run everything concurrently (API + Worker + Frontend)
npm run dev

# Or run components independently in separate terminals:
npm run dev:backend   # Express REST API (http://localhost:5000)
npm run dev:worker    # BullMQ Delivery Queue Consumer & Lease Monitor
npm run dev:frontend  # Next.js 16 Web Dashboard (http://localhost:3000)
```

---

## API Endpoint Reference

### Authentication (`/api/v1/auth` & `/api/auth`)
- `GET /api/auth/google` — Initiate OIDC PKCE redirect flow.
- `GET /api/auth/google/callback` — Exchange authorization code for authenticated session.
- `GET /api/v1/auth/me` — Return current session, profile, and RBAC permissions.
- `POST /api/v1/auth/logout` — Invalidate session and clear authentication cookie.
- `GET /api/v1/auth/status` — Return OAuth configuration status.

### Campaigns (`/api/v1/campaigns`)
- `GET /api/v1/campaigns` — List organization campaigns with status and search filters.
- `POST /api/v1/campaigns` — Create a new campaign draft.
- `GET /api/v1/campaigns/:id` — Retrieve campaign details and aggregated counts.
- `PATCH /api/v1/campaigns/:id` — Update campaign subject, body, sender, or delivery mode.
- `DELETE /api/v1/campaigns/:id` — Soft-delete draft or inactive campaign.
- `POST /api/v1/campaigns/:id/launch` — Validate readiness and transition to `RUNNING`.
- `POST /api/v1/campaigns/:id/pause` — Halt queue delivery (`PAUSED`).
- `POST /api/v1/campaigns/:id/resume` — Resume dispatching pending recipients.
- `POST /api/v1/campaigns/:id/cancel` — Permanently cancel active or scheduled campaign.
- `GET /api/v1/campaigns/:id/progress` — Server-Sent Events (SSE) live progress stream.

### Recipients & Imports (`/api/v1/campaigns/:id/recipients`)
- `GET /api/v1/campaigns/:id/recipients` — Paginated list of campaign recipients.
- `POST /api/v1/campaigns/:id/recipients/import` — Bulk import via CSV upload with column mapping or line-delimited email paste.
- `GET /api/v1/campaigns/:id/recipients/export` — Stream and download all campaign recipients as a CSV file with live delivery statuses.

### Contacts Directory (`/api/v1/contacts`)
- `GET /api/v1/contacts` — Paginated list of organization contacts with search and tag filters.
- `POST /api/v1/contacts` — Create or update individual contact.
- `GET /api/v1/contacts/export` — Stream and download entire organization contacts directory as CSV.
- `POST /api/v1/contacts/import` — Bulk import contacts from CSV with column mapping.
- `DELETE /api/v1/contacts/:id` — Soft-delete contact.
- `GET /api/v1/contacts/suppressions` — List organization-wide suppressed emails.
- `POST /api/v1/contacts/suppressions` — Add address to suppression list.

### Senders & Deliverability (`/api/v1/senders`)
- `GET /api/v1/senders` — List verified sender profiles with hourly limiters.
- `POST /api/v1/senders` — Add new sender address and display name.
- `DELETE /api/v1/senders/:id` — Delete sender profile.

### Operations & Observability (`/api/v1/operations`)
- `GET /health` — Liveness check (`status: ok`).
- `GET /readiness` — Deep check verifying database and Redis readiness.
- `GET /api/v1/operations/status` — Complete health breakdown for PostgreSQL, Redis, and SMTP.
- `GET /api/v1/analytics` — Real metrics calculated from delivery event logs.
- `GET /api/v1/activity` — Chronological stream of all delivery events.

---

## Operational Health, Observability & Recovery

### Automated Lease Recovery
If a worker instance terminates unexpectedly mid-delivery, its heartbeat lock expires after `LEASE_TIMEOUT_MS` (default: 60s). The `Crash Recovery Service` automatically detects stale leases, transitions the corresponding jobs back to `SCHEDULED`, and re-enqueues them with incremented attempt counts.

### Deterministic Idempotency
Double-sends are impossible:
$$\text{idempotencyKey} = \text{SHA-256}(\text{campaignId} + \text{":"} + \text{normalizedEmail})$$
Even if BullMQ delivers a job more than once across network retries, the atomic database lease ensures only one email is transmitted across SMTP.

---

## Continuous Integration

GoMAil uses **GitHub Actions** for CI. The pipeline runs on every push to `main`/`master` and every pull request. There is no Docker dependency — CI runs directly on GitHub-hosted Ubuntu runners with Node.js 22.

### CI Jobs

| Job | What it does |
|---|---|
| `backend` | TypeScript typecheck (`tsc --noEmit`) + `prisma validate` |
| `backend-tests` | Unit test suite via `vitest run` |
| `frontend` | TypeScript typecheck + Next.js production build |
| `frontend-tests` | Frontend unit tests via `vitest` |

### Deployment Targets

| Service | Platform | Notes |
|---|---|---|
| Backend API | **Render** | `npm run build -w backend && npm run start -w backend` |
| Background Worker | **Render** | `npm run start:worker -w backend` (separate process) |
| Frontend | **Vercel** | Next.js auto-detected, root dir: `frontend/` |
| Database | PostgreSQL | Managed provider of choice |
| Queue / Cache | Redis | Managed provider of choice (e.g., Upstash) |

> **Note:** Worker and API are separate processes sharing the same database and Redis instance. Run both on Render as separate services from the same repository.
