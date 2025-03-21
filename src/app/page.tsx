'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ReportList } from '@/components/ReportList';
import { createPendingReport, getCurrentWeekAnyReportGlobal } from '@/lib/services';
import Image from 'next/image';
import Link from 'next/link';
import type { WeeklyReport } from '@/types';
import { shouldCreateNewReport } from '@/lib/dateUtils';
import * as StorageUtils from '@/lib/storageUtils';

export default function Home() {
  // isChecking is used to track initialization state
  const [, setIsChecking] = useState(true);
  const [userName, setUserName] = useState('');
  const [pendingReport, setPendingReport] = useState<WeeklyReport | null>(null);
  const [listKey, setListKey] = useState(0); // Add a key for forcing re-render of ReportList
  
  useEffect(() => {
    // Check for an existing pending report or create a new one if needed
    const checkForPendingReport = async () => {
      try {
        // Get the stored user name from localStorage if available
        const storedName = StorageUtils.getItem('userName');
        if (storedName) {
          setUserName(storedName);
          
          // Check if anyone has a report for this week
          const existingReport = await getCurrentWeekAnyReportGlobal();
          
          if (existingReport && existingReport.status === 'pending') {
            console.log('Found pending report on dashboard:', existingReport);
            setPendingReport(existingReport);
            // Force ReportList to refresh by updating its key
            setListKey(prev => prev + 1);
          } else {
            console.log('No pending report found for this week');
          }
          
          // If no pending report exists and it's Monday after 6 AM Eastern Time, create one
          if (!existingReport && shouldCreateNewReport()) {
            console.log('Creating a new report for the week');
            const newReport = await createPendingReport(storedName);
            setPendingReport(newReport as unknown as WeeklyReport);
            // Force ReportList to refresh by updating its key
            setListKey(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Error checking for pending report:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkForPendingReport();
    
    // Save the user name to localStorage when it changes
    const handleNameChange = (e: StorageEvent) => {
      if (e.key === 'userName' && e.newValue) {
        setUserName(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleNameChange);
    
    return () => {
      window.removeEventListener('storage', handleNameChange);
    };
  }, []);
  
  const handleSaveName = (name: string) => {
    if (name.trim()) {
      StorageUtils.setItem('userName', name.trim());
      setUserName(name.trim());
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-white">
      <Header />
      
      <main className="flex-grow py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-[#c0ff54]">DASHBOARD</h1>
          </div>
          
          {pendingReport && (
            <div className="bg-[#1d2e17] rounded-lg shadow-md p-4 mb-6 border border-[#3b5824] transition-all duration-300 ease-in-out animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <p className="text-[#9adf21] mb-3 sm:mb-0">
                  <span className="font-medium">There is a pending report for this week.</span> Complete it before the week ends.
                  {pendingReport.userId && <span className="ml-1 text-sm">(Started by: {pendingReport.userId})</span>}
                </p>
                <Link 
                  href={`/reports/${pendingReport.id}/edit`}
                  className="px-4 py-2 bg-[#c0ff54] text-black rounded-md hover:bg-[#9adf21] font-medium transition-colors duration-200 ease-in-out transform hover:scale-105"
                >
                  COMPLETE REPORT
                </Link>
              </div>
            </div>
          )}
          
          {/* User name input if not already set */}
          {!userName && (
            <div className="bg-[#1a1a1a] rounded-lg shadow-md p-6 mb-8 border border-[#333333] transition-all duration-300 ease-in-out animate-fadeIn">
              <div className="flex justify-center mb-4">
                <Image 
                  src="/Green_on_Transparent_Logo_.png" 
                  alt="TERRASYNC Logo" 
                  width={200} 
                  height={50}
                  className="transition-transform duration-300 ease-in-out hover:scale-105"
                />
              </div>
              <h2 className="text-lg font-medium text-[#c0ff54] mb-4 text-center">WELCOME TO TERRASYNC</h2>
              <p className="text-gray-400 mb-4">
                Please enter your name to track your reports. This will help us organize your weekly submissions.
              </p>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="flex-grow px-3 py-2 border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-[#c0ff54] bg-[#222222] text-white transition-all duration-200"
                  onChange={(e) => {
                    const name = e.target.value.trim();
                    if (name) {
                      handleSaveName(name);
                    }
                  }}
                />
                <button
                  type="button"
                  className="ml-4 px-4 py-2 bg-[#c0ff54] hover:bg-[#9adf21] text-black rounded-md font-medium transition-all duration-200 ease-in-out transform hover:scale-105"
                  onClick={() => {
                    const input = document.querySelector('input');
                    if (input?.value.trim()) {
                      handleSaveName(input.value.trim());
                    }
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#1a1a1a] rounded-lg shadow-md p-6 border border-[#333333] transition-all duration-300 ease-in-out">
            <ReportList key={listKey} pendingReport={pendingReport} />
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
