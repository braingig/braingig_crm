# Remote Team Management System

A comprehensive cross-platform remote team and project management system built with modern web technologies.

## 🚀 Features

- **Employee Management**: Complete CRUD operations for managing employees with role-based access
- **Time Tracking**: Check-in/out system, time entries, and automatic duration calculations
- **Project Management**: Create and manage projects with budget tracking
- **Task Management**: Assign tasks, track progress, add comments
- **Payroll System**: Automatic salary calculations for fixed and hourly employees
- **Sales/CRM**: Lead management and sales pipeline tracking
- **Real-time Updates**: WebSocket support for notifications and live updates
- **Activity Logging**: Comprehensive audit trail of all system actions

## 🏗️ Architecture

```
├── backend/          # NestJS + GraphQL API
├── web/              # Next.js Web Application
├── mobile/           # React Native Mobile App
└── shared/           # Shared TypeScript types
```

### Tech Stack

#### Backend
- **Framework**: NestJS
- **API**: GraphQL (Apollo Server)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Real-time**: WebSocket (Socket.io)
- **Authentication**: JWT

#### Frontend (Web)
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Apollo Client
- **Charts**: Recharts

#### Mobile
- **Framework**: React Native
- **UI Library**: React Native Paper
- **Navigation**: React Navigation
- **State Management**: Apollo Client

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd officebrain
```

2. Start all services:
```bash
docker-compose up -d
```

3. Run database migrations and seed:
```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

4. Access the applications:
- Backend API: http://localhost:4000/graphql
- Web Application: http://localhost:3000

### Manual Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Generate Prisma Client:
```bash
npx prisma generate
```

7. Seed the database:
```bash
npm run prisma:seed
```

8. Start the development server:
```bash
npm run start:dev
```

#### Web Application Setup

1. Navigate to web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

4. Start the development server:
```bash
npm run dev
```

#### Mobile Application Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies (macOS only):
```bash
cd ios && pod install && cd ..
```

4. Start Metro bundler:
```bash
npm start
```

5. Run on iOS:
```bash
npm run ios
```

6. Run on Android:
```bash
npm run android
```

## 🔐 Default Login Credentials

After running the seed script, use these credentials to login:

- **Admin**: `admin@example.com` / `admin123`
- **Developer**: `developer@example.com` / `dev123`
- **Sales**: `sales@example.com` / `sales123`

## 📝 API Documentation

Access the GraphQL Playground at `http://localhost:4000/graphql` to explore the API schema and test queries/mutations.

### Sample Queries

```graphql
# Get current user
query {
  me {
    id
    name
    email
    role
  }
}

# Get all projects
query {
  projects {
    id
    name
    status
    budget
  }
}

# Get tasks assigned to me
query {
  tasks(filters: { assignedToId: "user-id" }) {
    id
    title
    status
    priority
  }
}
```

### Sample Mutations

```graphql
# Login
mutation {
  login(input: {
    email: "admin@example.com"
    password: "admin123"
  }) {
    accessToken
    refreshToken
    user {
      id
      name
      role
    }
  }
}

# Create a project
mutation {
  createProject(input: {
    name: "New Website"
    description: "Client website redesign"
    budget: 50000
    startDate: "2024-01-01"
  }) {
    id
    name
  }
}

# Start time tracking
mutation {
  startTimeEntry(input: {
    taskId: "task-id"
    description: "Working on feature X"
  }) {
    id
    startTime
  }
}
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
npm run test:e2e
```

### Web Tests
```bash
cd web
npm run test
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Web Application
```bash
cd web
npm run build
npm start
```

### Mobile Application
```bash
cd mobile
# iOS
npm run build:ios

# Android
cd android && ./gradlew assembleRelease
```

## 🐳 Docker Deployment

Build and run all services:
```bash
docker-compose up --build -d
```

Stop all services:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f
```

## 📚 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # Employee management
│   ├── projects/          # Project management
│   ├── tasks/             # Task management
│   ├── timesheets/        # Time tracking
│   ├── payroll/           # Payroll system
│   ├── sales/             # Sales/CRM
│   ├── notifications/     # WebSocket notifications
│   └── activity-logs/     # Audit logs
└── test/                  # Tests

web/
├── src/
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   ├── lib/               # Utilities & GraphQL
│   └── styles/            # CSS/Tailwind
└── public/                # Static assets

mobile/
├── src/
│   ├── screens/           # App screens
│   ├── components/        # React Native components
│   ├── navigation/        # Navigation setup
│   └── services/          # API services
├── ios/                   # iOS specific
└── android/               # Android specific
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

For support, email support@example.com or open an issue in the repository.

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Prisma team for the excellent ORM
- Next.js team for the powerful React framework
- React Native community

---

Built with ❤️ for remote teams worldwide
