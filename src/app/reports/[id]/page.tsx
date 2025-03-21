'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { getReportById, revertToPending } from '@/lib/services';
import type { WeeklyReport } from '@/types';
import Image from 'next/image';

export default function ReportDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReverting, setIsReverting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;

      try {
        const reportData = await getReportById(id as string);
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

  // Check if the report is from the current week
  const isCurrentWeek = (date: Date): boolean => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Go to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Start of day
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Go to Saturday
    endOfWeek.setHours(23, 59, 59, 999); // End of day
    
    return date >= startOfWeek && date <= endOfWeek;
  };

  const handleRevertToPending = async () => {
    if (!report || !id) return;
    
    if (window.confirm('Are you sure you want to reopen this report for editing?')) {
      try {
        setIsReverting(true);
        await revertToPending(id as string);
        
        // Navigate to the edit page
        router.push(`/reports/${id}/edit`);
      } catch (err) {
        console.error('Error reverting report:', err);
        alert('Failed to revert report. Please try again.');
        setIsReverting(false);
      }
    }
  };

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

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col bg-[#111111] text-white">
        <Header />
        <main className="flex-grow py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-[#1a1a1a] rounded-lg shadow-md p-6 border border-[#333333]">
              <div className="text-gray-400 mb-4">Report not found.</div>
              <Link href="/" className="text-[#c0ff54] hover:text-[#9adf21]">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const weekEnding = new Date(report.weekEndingDate).toLocaleDateString();
  const submittedOn = new Date(report.createdAt).toLocaleDateString();
  
  // Calculate overall progress based on numeric values
  const totalTargetValue = report.metrics.reduce((acc, metric) => acc + (metric.targetValue || 0), 0);
  const totalValue = report.metrics.reduce((acc, metric) => acc + (metric.value || 0), 0);
  const progressPercentage = totalTargetValue > 0 ? (totalValue / totalTargetValue) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-white">
      <Header />

      <main className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <h1 className="text-2xl font-bold text-[#c0ff54] mb-3 sm:mb-0">REPORT DETAILS</h1>
            <div className="flex items-center space-x-4">
              {report && 
               report.status === 'submitted' &&
               isCurrentWeek(report.weekEndingDate) && (
                <button
                  type="button"
                  onClick={handleRevertToPending}
                  disabled={isReverting}
                  className="text-yellow-400 hover:text-yellow-300 bg-yellow-900/30 px-4 py-2 rounded-md text-sm font-medium border border-yellow-800"
                >
                  {isReverting ? 'REOPENING...' : 'REOPEN FOR EDITING'}
                </button>
              )}
              <Link href="/" className="text-[#c0ff54] hover:text-[#9adf21] inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                  <title>Back arrow</title>
                  <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                </svg>
                BACK TO DASHBOARD
              </Link>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg shadow-md p-4 sm:p-6 border border-[#333333] relative overflow-hidden">
            {/* Background logo with opacity */}
            <div className="absolute inset-0 opacity-5 flex justify-center items-center overflow-hidden">
              <div className="w-full h-full relative">
                <Image 
                  src="/Black_on_Transparent_Logo.png" 
                  alt="TERRASYNC Background Logo" 
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h2 className="text-xl font-semibold text-[#c0ff54] flex items-center mb-2 sm:mb-0">
                    <Image 
                      src="/Green_on_Transparent_Logo_.png" 
                      alt="TERRASYNC Logo" 
                      width={24} 
                      height={24}
                      className="mr-2"
                    />
                    Submitted by: {report.userId}
                  </h2>
                  <span className="text-sm text-gray-400">
                    Week Ending: {weekEnding}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  Submitted on {submittedOn}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-[#c0ff54] mb-2">PERFORMANCE PROGRESS</h3>
                  <div className="flex items-center mb-2">
                    <div className="w-full bg-[#333333] rounded-full h-2.5 mr-2">
                      <div
                        className="bg-[#c0ff54] h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, progressPercentage)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {progressPercentage.toFixed(0)}% overall
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {progressPercentage >= 100 
                      ? 'All metrics exceeded! Great job!'
                      : progressPercentage >= 75
                        ? 'Making good progress on metrics!'
                        : 'Working toward performance targets.'}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium text-[#c0ff54] mb-3">WEEKLY SUMMARY</h3>
                <div className="bg-[#232323] p-4 rounded-md border border-[#333333]">
                  <p className="text-gray-300 whitespace-pre-line">{report.reportText}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium text-[#c0ff54] mb-4">PERFORMANCE METRICS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.metrics.map((metric) => {
                    const value = metric.value || 0;
                    const target = metric.targetValue || 0;
                    const percentage = target > 0 ? (value / target) * 100 : 0;
                    const isCompleted = percentage >= 100;
                    
                    return (
                      <div key={metric.id} className="border border-[#333333] bg-[#232323] rounded-lg p-4">
                        <div className="flex items-start">
                          <div className={`mt-0.5 mr-3 flex-shrink-0 ${isCompleted ? 'text-[#c0ff54]' : 'text-gray-500'}`}>
                            {isCompleted ? (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <title>Completed</title>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <title>Not completed</title>
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              </svg>
                            )}
                          </div>
                          <div className="w-full">
                            <h4 className="font-medium text-gray-300">{metric.title}</h4>
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-[#c0ff54] font-medium">{metric.target}</p>
                              <div className="text-sm">
                                <span className="text-[#c0ff54] font-medium">{value}</span>
                                <span className="text-gray-400">/{target}</span>
                              </div>
                            </div>
                            <div className="w-full bg-[#333333] rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-[#c0ff54] h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-400 mt-3">Frequency: {metric.frequency}</p>
                            {metric.previousValue !== undefined && (
                              <p className="text-sm text-gray-400 mt-1">
                                Previous {metric.frequency.toLowerCase()}: {metric.previousValue}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
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