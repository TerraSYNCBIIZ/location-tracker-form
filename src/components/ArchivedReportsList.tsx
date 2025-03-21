'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getArchivedReports, getPreviousArchivedReports, type FirestoreDocRef } from '@/lib/services';
import type { WeeklyReport } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

// Helper function to safely create document references and fetch the snapshot
const getDocumentSnapshot = async (id: string): Promise<FirestoreDocRef> => {
  const docRef = doc(db, 'weeklyReports', id);
  return await getDoc(docRef);
};

export const ArchivedReportsList = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const pageSize = 5;
  
  // Store the last doc for pagination
  const [lastDoc, setLastDoc] = useState<FirestoreDocRef | null>(null);
  
  // Store the first docs for each page to enable going back
  const [firstDocs, setFirstDocs] = useState<FirestoreDocRef[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await getArchivedReports(pageSize);
      
      setReports(data.reports);
      setLastDoc(data.lastDoc || null);
      
      // Store the first doc of the first page
      if (data.reports.length > 0) {
        const firstDocSnapshot = await getDocumentSnapshot(data.reports[0].id);
        setFirstDocs([firstDocSnapshot]);
      }
      
      setHasMore(data.reports.length === pageSize);
      setHasPrevious(false);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching archived reports:', error);
      setError('Failed to load archived reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadNextPage = async () => {
    if (!lastDoc) return;
    
    try {
      setLoading(true);
      
      const data = await getArchivedReports(pageSize, lastDoc);
      
      if (data.reports.length > 0) {
        setReports(data.reports);
        setLastDoc(data.lastDoc || null);
        
        // Store the first doc of this page
        const firstDocSnapshot = await getDocumentSnapshot(data.reports[0].id);
        setFirstDocs([...firstDocs, firstDocSnapshot]);
        
        setHasMore(data.reports.length === pageSize);
        setHasPrevious(true);
        setCurrentPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading next page:', error);
      setError('Failed to load more reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousPage = async () => {
    if (currentPage <= 1 || firstDocs.length < 2) return;
    
    try {
      setLoading(true);
      
      // Get the first doc of the previous page
      const prevPageFirstDoc = firstDocs[currentPage - 2];
      
      const data = await getPreviousArchivedReports(prevPageFirstDoc, pageSize);
      
      if (data.reports.length > 0) {
        setReports(data.reports);
        
        // Update the last doc to be the last item of the current page for next navigation
        const lastIndex = data.reports.length - 1;
        const lastDocSnapshot = await getDocumentSnapshot(data.reports[lastIndex].id);
        setLastDoc(lastDocSnapshot);
        
        // Remove the current page's first doc from the array
        setFirstDocs(firstDocs.slice(0, currentPage - 1));
        
        setHasMore(true);
        setHasPrevious(currentPage - 2 > 0);
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error loading previous page:', error);
      setError('Failed to load previous reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && reports.length === 0) {
    return <div className="text-center py-8 text-gray-300">Loading archived reports...</div>;
  }

  if (error && reports.length === 0) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">No archived reports found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-300 mb-4">ARCHIVED REPORTS</h3>
      
      <div className="space-y-4">
        {reports.map((report) => {
          const weekEnding = new Date(report.weekEndingDate).toLocaleDateString();
          const submittedOn = new Date(report.createdAt).toLocaleDateString();
          
          // Count completed metrics
          const completedCount = report.metrics.filter(m => m.completed).length;
          const totalMetrics = report.metrics.length;
          
          return (
            <div key={report.id} className="bg-[#232323] rounded-lg shadow-md p-5 border border-[#333333] mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                <h3 className="text-lg font-medium text-gray-300 mb-2 sm:mb-0">
                  {report.userId} - Week Ending: {weekEnding}
                </h3>
                <span className="text-sm text-gray-500">
                  Submitted on {submittedOn}
                </span>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-400 mb-1">Performance Summary</div>
                <div className="flex items-center">
                  <div className="w-full bg-[#333333] rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-[#c0ff54] h-2.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, report.metrics.reduce((acc, metric) => {
                          const value = metric.value || 0;
                          const target = metric.targetValue || 0;
                          return acc + (target > 0 ? (value / target) * 100 : 0);
                        }, 0) / report.metrics.length)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 whitespace-nowrap">
                    {(report.metrics.reduce((acc, metric) => {
                      const value = metric.value || 0;
                      const target = metric.targetValue || 0;
                      return acc + (target > 0 ? (value / target) * 100 : 0);
                    }, 0) / report.metrics.length).toFixed(0)}% overall
                  </span>
                </div>
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
      
      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-3 sm:space-y-0">
        <button
          type="button"
          onClick={loadPreviousPage}
          disabled={!hasPrevious || loading}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            hasPrevious 
              ? 'bg-[#333333] text-white hover:bg-[#444444]' 
              : 'bg-[#222222] text-gray-500 cursor-not-allowed'
          }`}
        >
          PREVIOUS
        </button>
        
        <span className="text-gray-400">PAGE {currentPage}</span>
        
        <button
          type="button"
          onClick={loadNextPage}
          disabled={!hasMore || loading}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            hasMore 
              ? 'bg-[#333333] text-white hover:bg-[#444444]' 
              : 'bg-[#222222] text-gray-500 cursor-not-allowed'
          }`}
        >
          NEXT
        </button>
      </div>
    </div>
  );
}; 