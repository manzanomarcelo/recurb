<div align="center">
  <h1>🔄 Recurb</h1>
  <p><strong>Self-hosted subscription tracking that respects your privacy</strong></p>

  <p>
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-community">Community</a>
  </p>

  <p>
    <a href="https://github.com/rahulvijay81/recurb/stargazers"><img src="https://img.shields.io/github/stars/rahulvijay81/recurb?style=social" alt="Stars"></a>
    <a href="https://github.com/rahulvijay81/recurb/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
    <a href="https://github.com/rahulvijay81/recurb/issues"><img src="https://img.shields.io/github/issues/rahulvijay81/recurb" alt="Issues"></a>
    <a href="https://github.com/rahulvijay81/recurb/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22"><img src="https://img.shields.io/github/issues/rahulvijay81/recurb/help%20wanted?color=orange" alt="Help Wanted"></a>
    <a href="https://github.com/rahulvijay81/recurb/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"><img src="https://img.shields.io/github/issues/rahulvijay81/recurb/good%20first%20issue?color=7057ff" alt="Good First Issues"></a>
    <a href="https://github.com/rahulvijay81/recurb/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  </p>

  <p>
    <a href="https://github.com/sponsors/rahulvijay81"><img src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github" alt="Sponsor"></a>
    <a href="https://buymeacoffee.com/rahulvijay81"><img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee"></a>
  </p>
</div>

---

## 📸 Screenshots

> Screenshots coming soon! Contributions welcome — see [#54](https://github.com/rahulvijay81/recurb/issues/54).

---

## ✨ Features

- 🔒 **Privacy-First** — Self-hosted, your data stays on your server
- 🗄️ **Multi-Database** — SQLite, PostgreSQL, or MySQL
- 📊 **Analytics & Forecasting** — Spending trends, vendor breakdowns, budget projections
- 🎨 **Modern UI** — Clean design with dark mode and responsive layout
- 👥 **Team Collaboration** — Role-based access (Owner, Admin, Member, Viewer) with audit logs
- 🔔 **Smart Alerts** — Renewal notifications and payment reminders
- 💰 **Cost Optimization** — Duplicate detection and spending insights
- 🔄 **Bulk Operations** — CSV import/export for subscriptions
- 🌍 **Multi-Currency** — USD, EUR, GBP, and more
- 🔧 **Extensible** — Feature flags, webhooks, and API-first design

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/rahulvijay81/recurb.git
cd recurb

# 2. Install (npm or pnpm)
npm install
# or: pnpm install

# 3. Configure
cp .env.example .env.local   # create .env.example first (see #40)
# Edit .env.local with your settings

# 4. Migrate & start
npm run migrate
npm run dev
```

Open `http://localhost:3000` and follow the setup wizard.

> **Docker support** is planned — [help wanted!](https://github.com/rahulvijay81/recurb/issues/45)

### Prerequisites

- Node.js 18+
- npm, [pnpm](https://pnpm.io/) (recommended), or yarn
- SQLite (default), PostgreSQL, or MySQL

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com/) |
| **State** | Zustand |
| **Charts** | Chart.js / react-chartjs-2 |
| **Auth** | JWT (jose), bcryptjs, role-based access control |
| **Database** | SQLite / PostgreSQL / MySQL via custom adapter |
| **Validation** | Zod |
| **Forms** | react-hook-form + @hookform/resolvers |
| **Scheduling** | node-cron |

---

## 🤝 Contributing

Recurb is open to contributions of all sizes! We have **65+ open issues** labeled to help you get started.

### 🟢 Good First Issues

New to the project? Start here — small, self-contained tasks with clear instructions:

[![Good First Issues](https://img.shields.io/github/issues/rahulvijay81/recurb/good%20first%20issue?color=7057ff)](https://github.com/rahulvijay81/recurb/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

### 🟠 Help Wanted

Larger features and bugs that need attention:

[![Help Wanted](https://img.shields.io/github/issues/rahulvijay81/recurb/help%20wanted?color=orange)](https://github.com/rahulvijay81/recurb/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)

### How to Contribute

1. **Find an issue** — Browse [open issues](https://github.com/rahulvijay81/recurb/issues) and comment to claim one
2. **Fork & branch** — `git checkout -b fix/issue-number-description`
3. **Code** — Match the existing style, keep changes focused
4. **Test** — Run `npm run build` to verify no errors
5. **PR** — Open a pull request, link the issue, describe your changes

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines, commit conventions, and development setup.

### What We Need Help With

| Area | Examples |
|------|---------|
| 🐛 **Bug fixes** | API crashes, auth gaps, database issues |
| 🔒 **Security** | Auth checks, CSRF, rate limiting |
| 🎨 **UI/UX** | Loading states, empty states, error handling |
| 📦 **Features** | Docker, Swagger docs, email notifications, MCP tool |
| 📝 **Docs** | Screenshots, guides, inline documentation |
| ⚙️ **Infra** | CI/CD, pnpm migration, database migration versioning |

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (admin)/           # Admin dashboard
│   ├── analytics/         # Analytics page
│   ├── api/               # REST API routes
│   │   ├── admin/         # Admin endpoints (users, roles, system, features, DB)
│   │   ├── analytics/     # Stats, trends, vendors
│   │   ├── auth/          # Login, register, forgot-password, permissions
│   │   ├── backup/        # Backup/restore
│   │   ├── categories/    # Category CRUD
│   │   ├── dashboard/     # Dashboard data
│   │   ├── setup/         # Setup wizard
│   │   └── subscriptions/ # Subscription CRUD + bulk import
│   ├── auth/              # Auth pages (login, register)
│   ├── calendar/          # Renewal calendar
│   ├── dashboard/         # Main dashboard
│   ├── settings/          # User settings
│   ├── setup/             # Initial setup wizard
│   ├── subscriptions/     # Subscription management
│   └── team/              # Team management
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── admin/            # Admin components
│   ├── analytics/        # Analytics widgets
│   ├── dashboard/        # Dashboard cards
│   ├── subscriptions/    # Subscription components
│   └── team/             # Team components
├── hooks/                # React hooks (useAuth, usePermission, stores)
├── lib/                  # Library code
│   ├── auth/            # JWT, permissions, client
│   ├── backup/          # Backup/restore logic
│   ├── config/          # Env validation
│   ├── db/              # Database adapter + migrations + schema
│   ├── schemas/         # Zod schemas + TypeScript types
│   ├── setup/           # Setup wizard logic
│   └── utils/           # CSRF, rate-limit, audit, export, financial
└── middleware.ts         # Auth + setup middleware
```

---

## 📚 Documentation

- [Contributing Guide](CONTRIBUTING.md) — Development setup and PR process
- [Architecture](ARCHITECTURE.md) — System design and data flow
- [Security Policy](SECURITY.md) — Reporting vulnerabilities
- [Changelog](CHANGELOG.md) — Release history and planned features

---

## 🌟 Community

- 🐛 [Issue Tracker](https://github.com/rahulvijay81/recurb/issues) — Bugs, features, discussions
- 📧 [Email](mailto:rahulvijay81@gmail.com) — Direct contact
- ⭐ Star the repo to show support!

---

## 💖 Support

If Recurb helps you, consider:

- ⭐ Starring the repository
- 💰 [Becoming a sponsor](https://github.com/sponsors/rahulvijay81)
- ☕ [Buying me a coffee](https://buymeacoffee.com/rahulvijay81)
- 🐛 Reporting bugs and suggesting features
- 📢 Sharing with others

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

Built with ❤️ using [Next.js](https://nextjs.org/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/), [Zustand](https://zustand-demo.pmnd.rs/), and many more.

---

<div align="center">
  <p>Made by <a href="https://github.com/rahulvijay81">Rahul Vijay</a></p>
  <p>⭐ Star us on GitHub — it helps a lot!</p>
</div>
