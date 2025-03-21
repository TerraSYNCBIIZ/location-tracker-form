'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { getReportById } from '@/lib/services';
import { ReportForm } from '@/components/ReportForm';
import type { WeeklyReport } from '@/types';

export default function EditReport() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;

      try {
        const reportData = await getReportById(id as string);
        
        // Only allow editing pending reports
        if (reportData.status !== 'pending') {
          setError('This report has already been submitted and cannot be edited.');
          setIsLoading(false);
          return;
        }
        
        setReport(reportData);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load the report. It may not exist.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#111111] text-white">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-gray-400">Loading report details...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#111111] text-white">
        <Header />
        <main className="flex-grow py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-[#1a1a1a] rounded-lg shadow-md p-6 border border-[#333333]">
              <div className="text-red-400 mb-4">{error}</div>
              <Link href="/" className="text-[#c0ff54] hover:text-[#9adf21]">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-white">
      <Header />

      <main className="flex-grow py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#c0ff54]">COMPLETE WEEKLY REPORT</h1>
            <p className="text-gray-400 mt-2">
              Fill out the form below to complete your weekly performance metrics report.
            </p>
          </div>

          <ReportForm pendingReport={report} />
        </div>
      </main>

      <footer className="bg-black py-6 border-t border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} TERRASYNC. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
} 