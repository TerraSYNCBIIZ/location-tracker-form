'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import { createPendingReport, getCurrentWeekAnyReportGlobal } from '@/lib/services';
import { useState } from 'react';
import * as StorageUtils from '@/lib/storageUtils';

export const Header = () => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [existingReportId, setExistingReportId] = useState('');
  const [existingReportStatus, setExistingReportStatus] = useState('');

  const handleCreateReport = async () => {
    try {
      setIsCreating(true);
      
      // Get the username from localStorage
      const userName = StorageUtils.getItem('userName');
      if (!userName) {
        alert('Please enter your name first');
        setIsCreating(false);
        return;
      }
      
      // Check if ANY report exists for this week (from any user)
      const existingReport = await getCurrentWeekAnyReportGlobal();
      
      if (existingReport) {
        // If a report already exists, show dialog instead of creating a new one
        setExistingReportId(existingReport.id);
        setExistingReportStatus(existingReport.status);
        setShowDialog(true);
        setIsCreating(false);
        return;
      }
      
      // Create a pending report for the user
      const pendingReport = await createPendingReport(userName);
      
      // Navigate to the edit page for the newly created report
      router.push(`/reports/${pendingReport.id}/edit`);
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Failed to create report. Please try again.');
      setIsCreating(false);
    }
  };
  
  const handleCloseDialog = () => {
    setShowDialog(false);
  };
  
  const handleViewExistingReport = () => {
    const url = existingReportStatus === 'pending' 
      ? `/reports/${existingReportId}/edit` 
      : `/reports/${existingReportId}`;
    
    router.push(url);
    setShowDialog(false);
  };
  
  return (
    <header className="bg-black text-white shadow-md relative overflow-hidden">
      {/* Background logo with opacity */}
      <div className="absolute inset-0 opacity-5 flex justify-center items-center overflow-hidden">
        <div className="w-full h-full relative">
          <Image 
            src="/Black_on_Transparent_Logo.png" 
            alt="TERRASYNC Background Logo" 
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>
      
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
                style={{ height: 'auto' }}
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between h-16">
          {/* Logo on the left */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/Green_on_Transparent_Logo_.png" 
                alt="TERRASYNC Logo" 
                width={180} 
                height={45}
                className="py-2"
                style={{ height: 'auto' }}
              />
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button 
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>Menu</title>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Centered title with growth icons - hidden on small screens */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center h-full">
            <div className="flex items-center">
              {/* Left growth icon - Trending Up */}
              <ArrowTrendingUpIcon 
                className="w-6 h-6 text-[#c0ff54]" 
                aria-hidden="true"
              />
              
              <span className="text-[#c0ff54] font-bold mx-2 text-lg uppercase tracking-wider">
                GROWTH TRACKER
              </span>
              
              {/* Right growth icon - also Trending Up */}
              <ArrowTrendingUpIcon
                className="w-6 h-6 text-[#c0ff54]" 
                aria-hidden="true"
              />
            </div>
          </div>
          
          {/* Navigation links on the right - hidden on mobile */}
          <div className="hidden sm:flex items-center space-x-4">
            <Link
              href="/"
              className="text-white hover:text-[#c0ff54] px-3 py-2 rounded-md text-sm font-medium"
            >
              DASHBOARD
            </Link>
            <Link
              href="/analytics"
              className="text-white hover:text-[#c0ff54] px-3 py-2 rounded-md text-sm font-medium"
            >
              ANALYTICS
            </Link>
            <button
              onClick={handleCreateReport}
              disabled={isCreating}
              type="button"
              className="bg-[#c0ff54] hover:bg-[#9adf21] text-black px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {isCreating ? 'CREATING...' : 'NEW REPORT'}
            </button>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {menuOpen && (
          <div className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="text-white hover:text-[#c0ff54] block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setMenuOpen(false)}
              >
                DASHBOARD
              </Link>
              <Link
                href="/analytics"
                className="text-white hover:text-[#c0ff54] block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setMenuOpen(false)}
              >
                ANALYTICS
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleCreateReport();
                }}
                disabled={isCreating}
                type="button"
                className="w-full text-left bg-[#c0ff54] hover:bg-[#9adf21] text-black block px-3 py-2 rounded-md text-base font-medium disabled:opacity-50"
              >
                {isCreating ? 'CREATING...' : 'NEW REPORT'}
              </button>
            </div>
            
            {/* Show the GROWTH TRACKER title on mobile when menu is open */}
            <div className="px-2 pt-2 pb-4 flex justify-center">
              <div className="flex items-center">
                <ArrowTrendingUpIcon 
                  className="w-5 h-5 text-[#c0ff54]" 
                  aria-hidden="true"
                />
                <span className="text-[#c0ff54] font-bold mx-2 text-base uppercase tracking-wider">
                  GROWTH TRACKER
                </span>
                <ArrowTrendingUpIcon
                  className="w-5 h-5 text-[#c0ff54]" 
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}; 