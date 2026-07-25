# Bayara - UAE Real Estate Marketplace

A bilingual (Arabic/English) real estate marketplace for the UAE, built with modern technologies and production-ready architecture.

## 🏠 What is Bayara?

Bayara is a comprehensive real estate platform connecting buyers, tenants, and RERA-certified agents across Dubai, Abu Dhabi, and Sharjah. The platform features:

- **Property Listings**: Browse apartments, villas, townhouses, and commercial properties
- **Agent Portal**: RERA-certified agents can list properties and manage inquiries
- **Payment Integration**: Secure payment processing via Stripe Checkout for subscriptions, listing boosts, and reservations
- **Bilingual Interface**: Full Arabic (default) and English language support
- **Advanced Search**: Filter by location, price, property type, amenities, and more
- **Saved Searches**: Get alerts when new properties match your criteria
- **Viewing Scheduling**: Book property viewings

## 🚀 Tech Stack

### Core Technologies

- **Monorepo**: Turborepo for efficient build management
- **Runtime**: Bun (JavaScript runtime) throughout the stack
- **Frontend**: Next.js 16 with App Router
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma 7 ORM
- **Authentication**: JWT-based auth with token rotation

### Key Libraries & Services

- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS 4
- **Internationalization**: next-intl for bilingual support
- **Payments**: Stripe Checkout (card payments in AED)
- **File Storage**: AWS S3 for property images
- **Email**: Resend for transactional emails
- **Security**: Helmet for security headers, bcrypt for password hashing

### Why This Stack?

- **Turborepo**: Efficient monorepo management with shared types and configurations
- **Prisma 7 + Driver Adapters**: Latest Prisma with improved performance and TypeScript support
- **next-intl**: Best-in-class i18n for Next.js with proper locale routing
- **Stripe**: Hosted Checkout for card payments; webhooks verify with raw request body
- **Bun**: Fast JavaScript runtime with native TypeScript support

## 🏗️ Architecture

```
bayut-clone/
├── apps/
│   ├── web/           # Next.js 16 frontend (Vercel deployment)
│   └── api/           # Express.js backend (Railway deployment)
├── packages/
│   ├── types/         # Shared TypeScript types (Zod schemas)
│   ├── ui/            # Shared React components (shadcn/ui)
│   ├── eslint-config/ # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
└── docs/              # Architecture documentation
```

### Request Flow

```
Browser → Next.js Frontend → Express API → PostgreSQL → Response
                ↓            ↓              ↓
            Static Assets  JWT Auth      Prisma ORM
            CDN/Vercel    Rate Limit     Data Access
```

### Service Layering

- **Routes**: HTTP endpoint definitions (`*.routes.ts`)
- **Controllers**: Request/response handling (`*.controller.ts`)
- **Services**: Business logic (`*.service.ts`)
- **Utils**: Helper functions (`AppError`, `catchAsync`)
- **Types**: Shared Zod schemas for validation

## ✨ Key Features

### For Buyers & Tenants

- Advanced property search with filters
- Save favorite properties
- Save search criteria and get alerts
- Contact agents directly
- Schedule property viewings
- Secure payment processing

### For Agents

- RERA certification verification
- Property listing management
- Lead tracking and management
- Subscription plans for enhanced features
- Viewing schedule management
- Analytics dashboard

### For Admins

- Agent application review
- Platform-wide analytics
- User management
- Content moderation

## 🛠️ Local Setup

### Prerequisites

- Bun runtime (latest version)
- PostgreSQL 16+
- Node.js 18+ (for some dependencies)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd bayut-clone
```

2. **Install dependencies**

```bash
bun install
```

3. **Set up environment variables**

For the API (`apps/api/.env`):

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values
```

Required API environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: At least 32 characters
- `JWT_REFRESH_SECRET`: At least 32 characters
- `AWS_ACCESS_KEY_ID`: AWS S3 access key
- `AWS_SECRET_ACCESS_KEY`: AWS S3 secret key
- `AWS_REGION`: AWS region (e.g., eu-north-1)
- `AWS_S3_BUCKET`: S3 bucket name
- `FRONTEND_URL`: Frontend URL (http://localhost:3000)
- `API_URL`: API URL (http://localhost:5000)

For the Web (`apps/web/.env.local`):

```bash
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your values
```

Required web environment variables:

- `NEXT_PUBLIC_API_URL`: API URL (http://localhost:5000)
- `NEXT_PUBLIC_APP_URL`: App URL (http://localhost:3000)

4. **Set up the database**

```bash
cd apps/api
bunx prisma migrate dev
bun run seed  # Optional: seed sample data
```

5. **Start development servers**

```bash
# From root directory
bun run dev
```

This will start:

- Frontend: http://localhost:3000
- API: http://localhost:5000
- API Docs: http://localhost:5000/docs

## 🚢 Deployment

### Frontend (Vercel)

1. Connect Vercel to GitHub repository
2. Configure environment variables
3. Deploy automatically on push to main

### Backend (Railway)

1. Create Railway project
2. Add PostgreSQL service
3. Configure environment variables
4. Deploy via GitHub integration

See `PRODUCTION_CHECKLIST.md` for detailed deployment instructions.

## 📚 Documentation

- **[Production Checklist](PRODUCTION_CHECKLIST.md)**: Pre-deployment requirements
- **[Security Audit](SECURITY_AUDIT.md)**: Security review and findings
- **Payments**: Stripe Checkout + webhook at `POST /payments/webhooks/stripe` (register in Stripe Dashboard)

## 🔒 Security

- JWT-based authentication with token rotation
- Rate limiting on all endpoints
- Security headers via Helmet
- CORS restriction in production
- Input validation via Zod schemas
- SQL injection prevention via Prisma ORM
- Password hashing with bcrypt
- Webhook signature verification

## 🧪 Testing

```bash
# Type checking
bun run check-types

# Linting
bun run lint

# Build
bun run build
```

## 📊 Live Demo

<!-- TODO: Add live demo URL -->
<!-- TODO: Add screenshots -->

- Homepage: [TODO]
- Property Listing: [TODO]
- Agent Dashboard: [TODO]

## 🤝 Contributing

This is a portfolio project demonstrating production-ready architecture. For contributions:

1. Follow existing code conventions
2. Add types for new features in `packages/types`
3. Use service/controller/route layering
4. Test thoroughly before committing

## 📄 License

This project is for educational/portfolio purposes.

## 🙏 Acknowledgments

- Built with [Turborepo](https://turbo.build/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Payment processing via [Stripe](https://stripe.com/)
- Inspired by [Bayut](https://www.bayut.com/)

---

**Note**: This is a portfolio project for demonstration purposes. Production deployment requires proper domain configuration, SSL certificates, and compliance with UAE real estate regulations.
