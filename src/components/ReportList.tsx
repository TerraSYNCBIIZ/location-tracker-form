'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getAllReports, deleteReport, archiveReport, createPendingReport, getCurrentWeekAnyReportGlobal } from '@/lib/services';
import type { WeeklyReport } from '@/types';
import { ArchivedReportsList } from './ArchivedReportsList';
import { TrashIcon, ArchiveBoxIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

type ReportListProps = {
  pendingReport?: WeeklyReport | null;
};

export const ReportList = ({ pendingReport }: ReportListProps) => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [existingReportId, setExistingReportId] = useState('');
  const [existingReportStatus, setExistingReportStatus] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      const allReports = await getAllReports();
      console.log('Fetched all reports:', allReports);
      setReports(allReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Immediately add the pendingReport when it changes
  useEffect(() => {
    if (pendingReport) {
      console.log('ReportList received pendingReport:', pendingReport);
      
      // Add it directly without checking if it exists - we'll handle duplicates below
      setReports(prevReports => {
        // Check if the report is already in the list to avoid duplicates
        const exists = prevReports.some(r => r.id === pendingReport.id);
        
        // If it exists, don't add it again
        if (exists) {
          console.log('Report already exists in list, not adding duplicate');
          return prevReports;
        }
        
        console.log('Adding pendingReport to reports list');
        return [pendingReport, ...prevReports];
      });
    }
  }, [pendingReport]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDelete = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report? This cannot be undone.')) {
      try {
        setIsDeleting(reportId);
        await deleteReport(reportId);
        
        // Remove the deleted report from the state
        setReports(prev => prev.filter(report => report.id !== reportId));
      } catch (err) {
        console.error('Error deleting report:', err);
        alert('Failed to delete report. Please try again.');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleArchive = async (reportId: string) => {
    try {
      setIsArchiving(reportId);
      await archiveReport(reportId);
      
      // Remove the archived report from the list
      setReports(prev => prev.filter(report => report.id !== reportId));
    } catch (err) {
      console.error('Error archiving report:', err);
      alert('Failed to archive report. Please try again.');
    } finally {
      setIsArchiving(null);
    }
  };

  const handleCreateReport = async () => {
    try {
      // Get the username from localStorage
      const userName = localStorage.getItem('userName');
      if (!userName) {
        alert('Please enter your name first');
        return;
      }

      // Check if ANY report exists for this week (from any user)
      const existingReport = await getCurrentWeekAnyReportGlobal();
      
      if (existingReport) {
        // If a report already exists, show dialog instead of creating a new one
        setExistingReportId(existingReport.id);
        setExistingReportStatus(existingReport.status);
        setShowDialog(true);
        return;
      }
      
      // Create a pending report for the user
      const pendingReport = await createPendingReport(userName);
      
      // Navigate to the edit page for the newly created report
      window.location.href = `/reports/${pendingReport.id}/edit`;
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Failed to create report. Please try again.');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };
  
  const handleViewExistingReport = () => {
    const url = existingReportStatus === 'pending' 
      ? `/reports/${existingReportId}/edit` 
      : `/reports/${existingReportId}`;
    
    window.location.href = url;
    setShowDialog(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-300">Loading reports...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  if (reports.length === 0 && !showArchived) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">No reports have been submitted yet.</p>
        <button 
          type="button"
          onClick={handleCreateReport}
          className="inline-block px-4 py-2 bg-[#c0ff54] text-black rounded-md hover:bg-[#9adf21] font-medium"
        >
          SUBMIT YOUR FIRST REPORT
        </button>
        
        {/* Existing report dialog */}
        {showDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333333] p-5 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <Image 
                  src="/Green_on_Transparent_Logo_.png" 
                  alt="TERRASYNC Logo" 
                  width={120} 
                  height={30}
                />
              </div>
              <h2 className="text-xl font-bold text-[#c0ff54] mb-3">REPORT ALREADY EXISTS</h2>
              <p className="text-gray-300 mb-4">
                {existingReportStatus === 'pending' 
                  ? 'There is already a pending report for this week. Would you like to continue working on it?' 
                  : 'A report has already been submitted for this week. Would you like to view it?'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 bg-[#333333] text-gray-300 rounded-md hover:bg-[#444444]"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleViewExistingReport}
                  className="px-4 py-2 bg-[#c0ff54] text-black rounded-md hover:bg-[#9adf21] font-medium"
                >
                  {existingReportStatus === 'pending' ? 'CONTINUE REPORT' : 'VIEW REPORT'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Separate reports into pending and submitted
  const pendingReports = reports.filter(report => report.status === 'pending');
  const submittedReports = reports.filter(report => report.status === 'submitted');

  console.log('Pending reports:', pendingReports.length, 'Submitted reports:', submittedReports.length);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#c0ff54] mb-4">PERFORMANCE REPORTS</h2>
        
        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className="px-4 py-2 bg-[#333333] text-white rounded-md hover:bg-[#444444] focus:outline-none text-sm"
        >
          {showArchived ? 'SHOW CURRENT REPORTS' : 'VIEW ARCHIVED REPORTS'}
        </button>
      </div>
      
      {showArchived ? (
        <ArchivedReportsList />
      ) : (
        <>
          {pendingReports.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-300 mb-4">PENDING REPORTS</h3>
              {pendingReports.map((report) => {
                const weekEnding = new Date(report.weekEndingDate).toLocaleDateString();
                
                return (
                  <div key={report.id} className="bg-[#232323] rounded-lg shadow-md p-5 border border-[#333333] mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                      <div className="mb-2 sm:mb-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-200 mr-2">
                          PENDING
                        </span>
                        <h3 className="text-lg font-medium text-gray-300 inline">
                          Week Ending: {weekEnding}
                        </h3>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(report.id)}
                          disabled={isDeleting === report.id}
                          className="p-1.5 bg-red-800 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                          title="Delete Report"
                        >
                          {isDeleting === report.id ? (
                            <span className="text-xs">DELETING...</span>
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-4">
                      This report is waiting to be filled out.
                    </p>
                    
                    <Link
                      href={`/reports/${report.id}/edit`}
                      className="inline-flex items-center px-4 py-2 bg-[#c0ff54] text-black rounded-md hover:bg-[#9adf21] font-medium"
                    >
                      COMPLETE REPORT
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
          
          {submittedReports.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-300 mb-4">SUBMITTED REPORTS</h3>
              {submittedReports.map((report) => {
                const weekEnding = new Date(report.weekEndingDate).toLocaleDateString();
                const submittedOn = new Date(report.createdAt).toLocaleDateString();
                
                // Calculate overall progress
                const totalTargetValue = report.metrics.reduce((acc, metric) => acc + (metric.targetValue || 0), 0);
                const totalValue = report.metrics.reduce((acc, metric) => acc + (metric.value || 0), 0);
                const progressPercentage = totalTargetValue > 0 ? (totalValue / totalTargetValue) * 100 : 0;
                
                return (
                  <div key={report.id} className="bg-[#232323] rounded-lg shadow-md p-5 border border-[#333333] mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                      <h3 className="text-lg font-medium text-gray-300 mb-2 sm:mb-0">
                        {report.userId} - Week Ending: {weekEnding}
                      </h3>
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 items-start sm:items-center">
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          Submitted on {submittedOn}
                        </span>
                        
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleArchive(report.id)}
                            disabled={isArchiving === report.id}
                            className="p-1.5 bg-blue-800 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                            title="Archive Report"
                          >
                            {isArchiving === report.id ? (
                              <span className="text-xs">ARCHIVING...</span>
                            ) : (
                              <ArchiveBoxIcon className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDelete(report.id)}
                            disabled={isDeleting === report.id}
                            className="p-1.5 bg-red-800 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                            title="Delete Report"
                          >
                            {isDeleting === report.id ? (
                              <span className="text-xs">DELETING...</span>
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-400 mb-1">Overall Progress</div>
                      <div className="flex items-center">
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
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-400 mb-1">Summary</div>
                      <p className="text-gray-300 line-clamp-3">{report.reportText}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {report.metrics.map((metric) => {
                        const value = metric.value || 0;
                        const target = metric.targetValue || 0;
                        const percentage = target > 0 ? (value / target) * 100 : 0;
                        const isCompleted = percentage >= 100;
                        
                        return (
                          <div key={metric.id} className="flex items-center text-sm">
                            <span className={`mr-2 ${isCompleted ? 'text-[#c0ff54]' : 'text-gray-500'}`}>
                              {isCompleted ? '✓' : '○'}
                            </span>
                            <span className="text-gray-300">{metric.title}:</span>
                            <span className="ml-1 text-[#c0ff54]">{value}</span>
                            <span className="text-gray-400 ml-1">/{target}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <Link
                      href={`/reports/${report.id}`}
                      className="inline-flex items-center px-4 py-2 bg-[#c0ff54] text-black rounded-md hover:bg-[#9adf21] font-medium gap-1"
                    >
                      VIEW FULL REPORT
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}; 