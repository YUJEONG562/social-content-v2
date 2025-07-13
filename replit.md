# SNS Content Generator

## Overview

This is a full-stack web application that generates Korean social media content using OpenAI's API. The application allows users to input a topic and generate three types of content: profile descriptions, review-style posts, and informational content. It features a modern React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Style**: RESTful API architecture
- **Build Tool**: esbuild for production builds

### Database Architecture
- **Database**: PostgreSQL (configured for use with Neon Database)
- **ORM**: Drizzle ORM with TypeScript-first approach
- **Schema Management**: Drizzle Kit for migrations
- **Validation**: Zod for runtime type validation integrated with Drizzle

## Key Components

### Core Features
1. **Content Generation**: Three types of SNS content generation (profile, review, info)
2. **Topic Input**: Text area for user to input content topics
3. **Real-time Generation**: Async content generation with loading states
4. **Content Display**: Formatted display of generated content with copy functionality

### UI Components
- **Form Controls**: Textarea, Button, Card components
- **Feedback**: Toast notifications for user feedback
- **Icons**: Lucide React icons for visual elements
- **Loading States**: Custom loading indicators for content generation

### Data Models
```typescript
// Content Request Schema
{
  id: serial (Primary Key)
  topic: text (Required)
  contentType: text (Required) // 'profile' | 'review' | 'info'
  generatedContent: text (Nullable)
  createdAt: timestamp (Default: now)
}
```

## Data Flow

1. **User Input**: User enters topic and selects content type
2. **API Request**: Frontend sends POST request to `/api/generate-content`
3. **Validation**: Server validates request using Zod schemas
4. **Database Storage**: Content request stored in PostgreSQL
5. **OpenAI Integration**: Server calls OpenAI API with specialized prompts
6. **Content Generation**: AI generates Korean SNS content based on type
7. **Response**: Generated content returned to frontend
8. **UI Update**: Content displayed in respective sections with copy functionality

### Storage Strategy
- **Development**: In-memory storage implementation for rapid development
- **Production**: PostgreSQL database with Drizzle ORM
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

## External Dependencies

### Core Dependencies
- **OpenAI API**: Content generation using GPT models
- **Neon Database**: Serverless PostgreSQL hosting
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management and caching

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Development server and build tool
- **Tailwind CSS**: Utility-first styling
- **Drizzle Kit**: Database schema management

### Authentication & Security
- **Environment Variables**: Secure API key management
- **CORS**: Cross-origin request handling
- **Input Validation**: Zod schemas for request validation

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles Express server to `dist/index.js`
3. **Database Migration**: Drizzle pushes schema changes to PostgreSQL

### Environment Configuration
- **Development**: Local development with HMR and error overlay
- **Production**: Optimized builds with environment-specific configs
- **Database**: Environment-based DATABASE_URL configuration

### Scripts
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server startup
- `npm run db:push`: Database schema deployment

### Replit Integration
- **Error Handling**: Runtime error modal for development
- **Development Banner**: Replit-specific development indicators
- **Cartographer**: Replit's code analysis tool integration

## Recent Changes

### Latest modifications with dates

**2025-01-10**: 
- Completely redesigned UI from single input + 3 buttons to tabbed interface
- Each category (profile/review/info) now has dedicated tab with own input field
- Layout changed to side-by-side: left side for input, right side for output
- Independent state management for each content type
- Custom tab navigation with category-specific color themes
- Added tone selection (formal/casual) for review and info content types
- Updated profile prompt to use emojis instead of numbers and match user example format
- Fixed tone setting to use real casual speech (반말) instead of polite casual (해요체)
- Removed ** markdown formatting from info content generation
- Added topic suggestion feature with dedicated API endpoint and UI
- User confirmed satisfaction with new interface structure

**2025-01-10** (Latest):
- Implemented daily usage limit system (10 generations per session per day)
- Added session-based tracking using express-session middleware
- Created usage status display with progress bar and remaining count
- Added API endpoint /api/usage-status for real-time usage monitoring
- Content generation and topic suggestion both count toward daily limit
- Buttons automatically disable when limit reached
- Added sessionId field to contentRequests schema for tracking
- Enhanced error handling for limit exceeded scenarios (HTTP 429)
- Usage resets daily based on session timestamp tracking

**2025-01-12** (Latest):
- Added comprehensive content sharing functionality
- Created shareId and isPublic fields in database schema for content sharing
- Built API endpoints for creating share links (/api/share/:id) and viewing shared content (/api/shared/:shareId)
- Added Share button to each generated content with automatic link copying
- Created dedicated shared content viewing page (/share/:shareId) with proper formatting
- Implemented content ID tracking to enable sharing for each generated piece
- Enhanced storage interface with createShareableContent and getSharedContent methods