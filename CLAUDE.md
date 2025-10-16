# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JAPAP is a real-time incident reporting platform with two main components:
- **japap-admin**: Next.js admin dashboard for managing alerts, users, and system operations  
- **japap-backend**: Express.js API server with Prisma ORM and PostgreSQL database

The platform allows users to report incidents through various channels (mobile app, WhatsApp, Telegram bots) and provides administrators with comprehensive tools for moderation, validation, and broadcast management.

## Development Commands

### Admin Dashboard (japap-admin/)
- **Development**: `npm run dev` - Starts Next.js dev server on http://localhost:3000
- **Build**: `npm run build` - Creates production build
- **Production**: `npm run start` - Runs production build
- **Lint**: `npm run lint` - ESLint checking

### Backend API (japap-backend/)
- **Development**: `npm run dev` - Starts Express server with nodemon on http://localhost:4000
- **Production**: `npm start` - Runs production server
- **Tests**: `npm test` (currently placeholder)

## Architecture

### Frontend (japap-admin)
- **Framework**: Next.js 15 with App Router
- **UI Library**: Radix UI components with Tailwind CSS v4
- **Map Integration**: Leaflet with React-Leaflet for geographical features
- **State Management**: React hooks and context (no external state library)
- **Type Safety**: TypeScript with strict mode

**Key Directories:**
- `app/`: Next.js App Router pages and API routes
- `components/`: Reusable UI components organized by category (ui/, layout/, dashboard/, map/)
- `lib/`: Utility functions, API clients, and shared logic

### Backend (japap-backend)
- **Framework**: Express.js with CORS enabled
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: Socket.io for live updates
- **External Services**: Redis for caching, node-cron for scheduled tasks

**Key Directories:**
- `src/controllers/`: Request handlers for business logic
- `src/routes/`: API endpoint definitions
- `src/config/`: Database and service configurations
- `src/models/`: Prisma schema and data models
- `prisma/`: Database schema and migrations

### Database Schema (Prisma)
Core entities:
- `User`: User accounts with reputation scoring and role-based access
- `Alert`: Incident reports with location data, categorization, and expiration
- `AlertConfirmation`: Community validation system
- `MessageBot`: Bot message processing and interpretation
- `Notification`: Push notification and alert distribution

## Admin Dashboard Features

The dashboard follows a comprehensive 10-module structure:

1. **Dashboard**: Overview with KPIs, active alerts, and heatmaps
2. **Signalements (Alerts)**: Alert management with batch operations and detailed views
3. **Carte & Zones**: Interactive Leaflet maps with zone management and geofencing
4. **Modération**: Queue-based alert validation with community scoring
5. **Utilisateurs**: User management with reputation tracking
6. **Diffusion & Bots**: Multi-channel broadcasting (WhatsApp, Telegram, Push)
7. **Notifications & Templates**: Message templating and campaign management
8. **Statistiques**: Analytics and reporting with CSV export
9. **Journal & Sécurité**: Audit logging and GDPR compliance
10. **Paramètres**: System configuration and role management

## API Integration

The admin dashboard communicates with the backend via:
- **REST API**: Standard CRUD operations for entities
- **Geocoding API**: Address resolution and location services (`/api/geocode`)
- **Real-time updates**: Socket.io connections for live alert updates

## UI Components

Built on Radix UI primitives with custom styling:
- `components/ui/`: Base UI components (buttons, cards, forms, dialogs)
- `components/layout/`: Navigation components (AppSidebar, Header, Breadcrumb)
- `components/dashboard/`: Dashboard-specific components (AlertCard)
- `components/map/`: Leaflet map integration components

## Key Configuration Files

- `prisma/schema.prisma`: Database schema with comprehensive alert and user models
- `lib/menuItems.ts`: Dashboard navigation structure and quick actions
- `tailwind.config.*`: Tailwind CSS v4 configuration
- `next.config.ts`: Next.js configuration (minimal setup)

## Development Workflow

When working on this codebase:
1. Start both services: `npm run dev` in japap-admin/ and japap-backend/
2. Database changes require Prisma migrations in japap-backend/
3. UI components should follow the established Radix UI + Tailwind pattern
4. Map features use Leaflet - ensure proper client-side rendering with Next.js
5. All alert-related features should consider the multi-step workflow: reporting → moderation → validation → broadcast → expiration

## Data Flow

Typical alert lifecycle:
1. **Input**: Bot messages or manual reports
2. **Processing**: Category interpretation and location parsing  
3. **Moderation**: Queue-based validation with scoring
4. **Broadcasting**: Multi-channel distribution
5. **Community Feedback**: Confirmations and reputation adjustments
6. **Expiration**: Automatic cleanup based on category rules