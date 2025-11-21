 🛠️ Stack Técnico de VittaSami

  Frontend

  - Framework: Next.js 15.5.3 (App Router)
  - Language: TypeScript (strict mode)
  - UI Library: React 19
  - Styling: Tailwind CSS 3.4.0
  - Animations: Framer Motion
  - Icons: Lucide React
  - Forms: React Hook Form (probablemente)

  Backend

  - Runtime: Node.js (recomendado v20+)
  - API Framework: Next.js API Routes (serverless)
  - Authentication: Supabase Auth (@supabase/ssr)
  - Database Client: Supabase JavaScript Client

  Base de Datos

  - Primary DB: PostgreSQL (via Supabase)
  - Features:
    - Row Level Security (RLS)
    - Multi-tenant architecture
    - Real-time subscriptions
  - Migrations: SQL migrations en supabase/migrations/
  - Connection: https://mvvxeqhsatkqtsrulcil.supabase.co

  Servicios de Terceros

  - Payments: Stripe
  - Auth & DB: Supabase
  - Notifications:
    - Email (SMTP - pendiente configuración)
    - WhatsApp (Twilio - pendiente configuración)

  Testing

  - E2E Testing: Playwright
  - Test Suites:
    - tests/authentication.spec.ts
    - tests/booking.spec.ts
    - tests/dashboard.spec.ts
    - tests/patient-management.spec.ts
    - tests/agenda-management.spec.ts
    - tests/appointment-lifecycle.spec.ts
    - tests/integration.spec.ts
  - Status: 100+ tests, 14/19 authentication tests passing

  Business Logic

  - Orchestration: Context7 flows (custom business flow management)
  - Pattern: Flow-based with rollback capabilities

  DevOps & Deployment

  - Hosting: Digital Ocean (droplet)
  - CI/CD: GitHub Actions
  - Domains:
    - Marketing: vittasami.com
    - SaaS App: app.vittasami.lat
  - Web Server: Nginx (reverse proxy)

  Development Tools

  - Package Manager: npm
  - Linting: ESLint
  - Type Checking: TypeScript compiler
  - Dev Server Port: 3003 (auto-detection 3000-3003)

  Architecture Pattern

  - Type: Monorepo (single Next.js app)
  - Routing: Route Groups para separación marketing/app
  - Multi-tenancy: Tenant isolation con RLS
  - Auth: Role-based access control (admin_tenant, doctor, patient)