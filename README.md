# CliniCore Frontend

Modern web interface for the CliniCore Healthcare Management System built with Next.js 14.

## Features

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful and accessible UI components
- **Lucide React** - Modern icon library

## Prerequisites

- Node.js 18+
- npm or yarn

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your API URL and other settings
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout with sidebar
│   │   ├── page.tsx      # Dashboard page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── app-sidebar.tsx  # Main navigation sidebar
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions
├── public/               # Static assets
└── package.json          # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for the component library. To add new components:

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add table
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=CliniCore
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Features

### Dashboard
- Overview of key metrics
- Recent activity feed
- Quick action buttons

### Navigation
- Collapsible sidebar with main menu items
- Responsive design for mobile and desktop
- Icons from Lucide React

### Layout
- Sticky header with sidebar toggle
- Main content area with proper spacing
- Responsive grid system

## Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful component and variable names

### Styling
- Use Tailwind CSS utility classes
- Follow shadcn/ui theming conventions
- Maintain consistent spacing and colors

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
