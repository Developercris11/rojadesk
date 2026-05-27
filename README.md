# RojaDesk CRM

Modern Agency Management & Automation Platform

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Auth routes (login, register)
│   ├── (dashboard)/            # Dashboard layout group
│   │   ├── agencies/           # Agency management
│   │   ├── leads/              # Lead management
│   │   ├── teams/              # Team management
│   │   ├── prospector/         # Prospector tool
│   │   ├── email/              # Email campaigns
│   │   ├── scraping/           # Web scraping tools
│   │   └── tools/              # Misc tools (tax calculators, address verification)
│   └── api/v1/                 # API routes (v1)
│       ├── agencies/
│       ├── leads/
│       ├── teams/
│       └── scraping/
├── components/
│   ├── common/                 # Reusable components (sidebar, header, etc)
│   └── forms/                  # Form components
├── lib/
│   ├── db/                     # Database (Prisma)
│   ├── services/               # Business logic services
│   ├── constants/              # App constants
│   └── utils/                  # Utility functions
└── styles/                     # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone <repo-url>

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Setup database
npx prisma migrate dev

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## 📦 Scripts

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Database
npx prisma migrate dev    # Create migration
npx prisma studio        # Open Prisma Studio

# Linting
npm run lint
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19
- **Styling**: Tailwind CSS + PostCSS
- **Database**: SQLite + Prisma ORM
- **Authentication**: NextAuth.js
- **Email**: Resend
- **Scraping**: Puppeteer
- **Maps**: Google Maps API
- **Cloud Storage**: AWS S3
- **Deployment**: Vercel

## 📋 Features

- **Agency Management**: Track and manage multiple agencies
- **Lead Management**: Full CRM lead pipeline
- **Team Collaboration**: Team-based organization
- **Web Scraping**: Automated data collection
- **Email Campaigns**: Email marketing & outreach
- **Address Verification**: Real-time address validation
- **Tax Calculators**: Minnesota & Sales Tax calculations
- **Business Directory**: Integrated business prospector

## 🔐 Environment Variables

See `.env.example` for all required variables.

## 📝 License

ISC

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

**Deployment**: This project is optimized for deployment on [Vercel](https://vercel.com)
