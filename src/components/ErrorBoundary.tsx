'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle errors in the React component tree
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-white p-4">
          <div className="max-w-md w-full bg-[#1a1a1a] rounded-lg shadow-lg p-6 border border-[#333333]">
            <div className="flex justify-center mb-6">
              <Image
                src="/Green_on_Transparent_Logo_.png"
                alt="TERRASYNC Logo"
                width={150}
                height={40}
                style={{ height: 'auto' }}
              />
            </div>
            
            <h1 className="text-xl font-bold text-[#c0ff54] mb-4 text-center">Something went wrong</h1>
            
            <p className="text-gray-300 mb-6">
              We apologize for the inconvenience. Please try refreshing the page or return to the dashboard.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#333333] text-white rounded-md hover:bg-[#444444] transition-colors"
              >
                Refresh Page
              </button>
              
              <Link
                href="/"
                className="px-4 py-2 bg-[#c0ff54] text-black rounded-md hover:bg-[#9adf21] font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 