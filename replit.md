# My College Finance - Savings Goal Calculator

## Overview

This is a full-stack web application designed to help college students and young adults create, track, and manage their savings goals. The application provides an intuitive interface for calculating savings requirements, visualizing progress, and offering educational financial guidance. Built with modern web technologies, it features a responsive design with both light and dark themes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI components with shadcn/ui for consistent, accessible design
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with structured error handling

### Development Setup
- **Development Server**: Vite dev server with HMR
- **Database Migrations**: Drizzle Kit for schema management
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **Type Safety**: Shared TypeScript schemas between frontend and backend

## Key Components

### Data Models
- **Users**: Basic user management with username/password
- **Savings Goals**: Comprehensive goal tracking with fields for:
  - Goal type (education, emergency, home, vacation, car, retirement, investment, other)
  - Target amount and current savings
  - Target date and monthly capacity
  - Creation and update timestamps
  - Active/inactive status

### Core Features
1. **Goal Selection**: Visual card-based interface for choosing goal types
2. **Savings Calculator**: Interactive calculator with real-time updates
3. **Progress Visualization**: Circular progress indicators and milestone tracking
4. **Multiple Goals Management**: Overview and management of multiple savings goals
5. **Educational Tips**: Contextual financial advice based on goal type
6. **PDF Export**: Generate savings plan reports
7. **What-if Scenarios**: Explore different saving amounts and timelines

### UI Components
- **Theme System**: Light/dark mode with system preference detection
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: ARIA-compliant components from Radix UI
- **Brand Identity**: Custom owl logo with college finance branding
- **Interactive Elements**: Sliders, progress bars, and animated transitions

## Data Flow

### Client-Side Flow
1. User selects a savings goal type from visual cards
2. Form inputs update calculations in real-time
3. TanStack Query manages API calls and caching
4. Results are displayed with progress visualization and educational tips
5. Users can save goals and view/edit existing ones

### Server-Side Flow
1. Express routes handle CRUD operations for savings goals
2. Zod schemas validate incoming data
3. Drizzle ORM manages database interactions
4. In-memory storage fallback for development
5. Structured error responses with proper HTTP status codes

### Database Schema
- Users table with basic authentication fields
- Savings goals table with comprehensive tracking fields
- PostgreSQL-specific features like UUID generation
- Proper indexing and relationships for performance

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, Radix UI primitives
- **Styling**: Tailwind CSS, class-variance-authority
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form, Hookform resolvers
- **Validation**: Zod for schema validation
- **Utilities**: date-fns, clsx, lucide-react icons
- **PDF Generation**: jsPDF for report exports

### Backend Dependencies
- **Web Framework**: Express.js
- **Database**: Drizzle ORM, Neon Database driver
- **Session Management**: connect-pg-simple
- **Validation**: Zod (shared with frontend)
- **Development**: tsx for TypeScript execution

### Development Tools
- **Build Tools**: Vite, esbuild
- **Type Checking**: TypeScript with strict mode
- **Database Tools**: Drizzle Kit for migrations
- **Replit Integration**: Custom plugins for development environment

## Deployment Strategy

### Development Environment
- Vite dev server with hot module replacement
- In-memory storage for rapid prototyping
- Repl.it integration with custom banners and cartographer plugin
- Environment-specific configurations

### Production Build
- Frontend: Vite build with optimizations
- Backend: esbuild bundling for Node.js deployment
- Static asset serving through Express
- Database migrations through Drizzle Kit

### Database Strategy
- PostgreSQL as primary database (Neon serverless)
- Drizzle ORM for type-safe database operations
- Migration system for schema evolution
- Fallback to in-memory storage for development

### Configuration Management
- Environment variables for database URLs
- Theme persistence in localStorage
- Responsive design breakpoints
- Cross-platform compatibility

The application is designed to be educational, user-friendly, and scalable, with a focus on helping young adults develop healthy financial habits through interactive goal setting and progress tracking.