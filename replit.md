# My College Finance - Savings Goal Calculator

## Overview

This is a full-stack web application designed to help college students and young adults create, track, and manage their savings goals. The application provides an intuitive interface for calculating savings requirements, visualizing progress, and offering educational financial guidance. Built with modern web technologies, it features a responsive design with both light and dark themes.

## Recent Changes (v4.0.0 Beta - January 31, 2025)

### Production-Ready User Authentication & Data Isolation
- Implemented comprehensive user authentication system with login/register functionality
- Added session management with PostgreSQL storage for persistent login sessions
- All API routes now require authentication and enforce data ownership rules
- Users can only access and modify their own savings goals (complete data isolation)
- Guest mode allows users to try the app before creating an account
- Authentication banners guide users to save their progress
- Secure password hashing with bcrypt and proper session handling

### Security & Privacy Features
- Foreign key constraints ensure data integrity between users and goals
- All savings goals are tied to authenticated user accounts
- Guest sessions are isolated and temporary (data not persisted)
- Proper authentication middleware protects all sensitive endpoints
- Session-based authentication with secure cookie configuration

### User Experience Improvements
- Intuitive authentication modal with login/register tabs
- Clear visual indicators for guest vs authenticated states
- Seamless authentication flow with toast notifications
- User status display showing current login state
- Easy logout functionality with confirmation

## Previous Changes (v3.0.0 Beta - January 31, 2025)

### Button Text Color Updates
- Updated "Download PDF Report" and "Share Savings Plan" buttons to use text-[#030711] for better readability on colored backgrounds
- Improved contrast and visual accessibility across all action buttons

### Savings Tracker Dashboard Enhancements
- Renamed "Multiple Goals Dashboard" to "Savings Tracker Dashboard" for better clarity
- Added individual Download and Share buttons for each saved goal
- Added edited date and time display for each goal card
- Implemented proper null handling for currentSavings and updatedAt fields
- Enhanced user experience with isolated click events for actions vs. editing

### Main Area Improvements
- Added prominent "Create New Savings Goal" button in main area above dashboard
- Changed icon from graduation cap to Plus symbol for better UX clarity
- Improved visual hierarchy and call-to-action prominence

### Footer Redesign
- Replaced graduation cap icon with actual My College Finance logo
- Added gradient background (gray-900 to black) for visual depth
- Enhanced typography with better spacing and font weights
- Consolidated copyright and version information
- Added "MY COLLEGE FINANCE" text next to logo
- Updated version to v3.0.0 (Beta)
- Improved link hover effects and visual hierarchy

### Header Updates
- Increased logo size from 48px to 52px (8% larger) for better visibility
- Maintained all animations and responsive behavior

### Technical Improvements
- Fixed TypeScript errors with proper null checking for goal properties
- Enhanced error handling and toast notifications
- Improved PDF generation for individual goals
- Better state management for goal editing and creation

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
- **Database**: PostgreSQL with Drizzle ORM (Active)
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with structured error handling
- **Storage**: DatabaseStorage class for persistent data storage

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
- PostgreSQL as primary database (Neon serverless) - ACTIVE
- Drizzle ORM for type-safe database operations
- Migration system for schema evolution with drizzle-kit push
- DatabaseStorage class implementation for persistent data
- Tables: users, savings_goals with proper relationships and indexing

### Configuration Management
- Environment variables for database URLs
- Theme persistence in localStorage
- Responsive design breakpoints
- Cross-platform compatibility

The application is designed to be educational, user-friendly, and scalable, with a focus on helping young adults develop healthy financial habits through interactive goal setting and progress tracking.

## Current Status (Checkpoint: January 31, 2025, 7:17 PM)

### Completed Features
✓ Enhanced PDF generation with individual goal download/share capabilities
✓ Improved Savings Tracker Dashboard with comprehensive goal management
✓ Professional footer with proper branding and legal information
✓ Optimized button styling and accessibility
✓ Better visual hierarchy and user experience
✓ Individual goal tracking with edit timestamps
✓ Dark/light theme support with proper contrast
✓ PostgreSQL database integration with persistent storage
✓ Comprehensive error handling and user feedback

### Key Functionality
- Create, edit, and delete savings goals
- Real-time progress visualization and calculations
- Individual PDF export for each goal
- Social sharing capabilities
- Educational tips and guidance
- Multi-goal dashboard overview
- Professional branding and footer
- Responsive design for all devices

### Version Information
- Current Version: v4.0.0 (Beta)
- Database: PostgreSQL with Drizzle ORM
- Storage: DatabaseStorage implementation (active)
- Theme Support: Light/Dark mode with system preference detection