# TERRASYNC Performance Tracker

A Next.js application for tracking weekly performance metrics. This system allows users to create, submit, and review weekly reports.

## Features

- Weekly performance report creation and submission
- Performance metrics tracking over time
- Analytics dashboard with visual charts
- Report archiving and management
- Eastern Time (ET) standardization across the platform

## Tech Stack

- **Frontend**: Next.js 15.2.3, React 19, TailwindCSS 4
- **Backend**: Firebase Firestore
- **Authentication**: Simple username-based identification
- **Data Visualization**: Recharts
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/terrasync.git
cd terrasync
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Set up environment variables
Create a `.env.local` file in the root directory with your Firebase configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

- `src/app/` - Next.js app router pages and layout
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and services
- `src/types/` - TypeScript type definitions
- `public/` - Static assets

## Time Zone Handling

The application uses Eastern Time (ET) as the standard time zone for all date-related operations. It properly handles transitions between Eastern Standard Time (EST) and Eastern Daylight Time (EDT).

## Error Handling

The application includes an ErrorBoundary component that catches and displays errors in a user-friendly way.

## License

This project is proprietary and all rights are reserved.
