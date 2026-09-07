# Reach - Interest-Based Social Discovery Platform

## Vision
A social discovery platform for Zambians of all age groups to connect based on shared interests, hobbies, and activities rather than looks-based swiping.

## Core Features

### MVP (Phase 1)
- ✅ User authentication (email/phone)
- ✅ Interest-based profiles
- ✅ Discovery/matching algorithm
- ✅ Messaging system
- ✅ Premium paywall (Stripe + Flutterwave)

### Phase 2
- Location-based discovery
- Activity listings ("grab coffee this weekend")
- Verification system
- Safety features (blocking, reporting)

### Phase 3
- Mobile app (React Native)
- Events/groups
- Notifications
- Analytics

## Tech Stack

### Frontend
- React 18+
- TypeScript
- Tailwind CSS
- Axios (API client)
- Socket.io-client (real-time messaging)

### Backend
- Node.js + Express
- PostgreSQL
- Redis (caching/sessions)
- Socket.io (WebSocket)
- JWT (authentication)
- Stripe + Flutterwave (payments)

### Deployment
- Frontend: Vercel
- Backend: Railway or Render
- Database: Railway PostgreSQL or AWS RDS

## Project Structure

```
reach/
├── frontend/          # React app
├── backend/           # Node.js API
├── docs/              # Documentation
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis
- Git

### Setup

1. Clone the repository
2. Follow frontend and backend setup guides in their respective folders
3. Configure environment variables
4. Run database migrations
5. Start development servers

## Environment Variables

See `.env.example` files in frontend/ and backend/ directories

## API Documentation

See `docs/API.md`

## Database Schema

See `docs/DATABASE.md`

## Contributing

This is a solo project currently. Once stable, will open for contributions.

## License

MIT

## Author

Built for Zambians 🇿🇲
