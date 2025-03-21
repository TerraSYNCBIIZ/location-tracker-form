'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { submitWeeklyReport, submitPendingReport, DEFAULT_METRICS, calculateMonthlyProgress, updateReport } from '@/lib/services';
import type { MetricData, WeeklyReport } from '@/types';
import Image from 'next/image';

type ReportFormProps = {
  pendingReport?: WeeklyReport | null;
};

export const ReportForm = ({ pendingReport }: ReportFormProps) => {
  const [name, setName] = useState(pendingReport?.userId || '');
  const [reportText, setReportText] = useState(pendingReport?.reportText || '');
  const [metrics, setMetrics] = useState<MetricData[]>(pendingReport?.metrics || DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [monthlyProgress, setMonthlyProgress] = useState<Record<string, { value: number; targetValue: number; frequency: string }>>({});
  const router = useRouter();

  // Helper function to get default target values based on metric title - memoized to avoid dependency issues
  const getDefaultTargetValue = useCallback((title: string): number => {
    const defaultMetric = DEFAULT_METRICS.find(m => m.title === title);
    return defaultMetric?.targetValue || 0;
  }, []);

  // If the pending report changes, update form fields
  useEffect(() => {
    const initializeForm = async () => {
      if (pendingReport) {
        setName(pendingReport.userId || '');
        setReportText(pendingReport.reportText || '');
        
        // Ensure metrics have targetValue set correctly
        const updatedMetrics = pendingReport.metrics && pendingReport.metrics.length > 0
          ? pendingReport.metrics.map(metric => ({
              ...metric,
              targetValue: metric.targetValue || getDefaultTargetValue(metric.title)
            }))
          : DEFAULT_METRICS;
        
        // Fetch monthly progress data if we have a username
        if (pendingReport.userId) {
          try {
            const progress = await calculateMonthlyProgress(pendingReport.userId);
            setMonthlyProgress(progress);
          } catch (err) {
            console.error('Error fetching monthly progress:', err);
          }
        }
          
        setMetrics(updatedMetrics);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    initializeForm();
  }, [pendingReport, getDefaultTargetValue]);

  const handleMetricValueChange = (id: string, value: number) => {
    setMetrics(prevMetrics => prevMetrics.map(metric => 
      metric.id === id ? { 
        ...metric, 
        value: value,
        completed: value >= (metric.targetValue || 0)
      } : metric
    ));
  };

  // Handle slider change
  const handleSliderChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    handleMetricValueChange(id, value);
  };

  // Handle saving report edits
  const saveEdits = async (): Promise<void> => {
    if (!pendingReport) return;
    
    try {
      // Using the existing updateReport function to save changes
      await updateReport(pendingReport.id, {
        userId: name,
        reportText,
        metrics,
        status: 'pending' // Ensure it remains pending
      });
    } catch (err) {
      console.error('Error saving report edits:', err);
    }
  };
  
  // Function to handle loading and navigating
  const navigateWithLoading = async (callback: () => Promise<void>) => {
    try {
      setLoading(true);
      await callback();
      // We'll let the redirect happen naturally, but with a smoother transition
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (pendingReport) {
      await navigateWithLoading(saveEdits);
    }
    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!reportText.trim()) {
      setError('Please provide a report summary');
      return;
    }
    
    setError('');
    
    await navigateWithLoading(async () => {
      if (pendingReport) {
        // Update the existing pending report
        await submitPendingReport(
          pendingReport.id,
          name,
          reportText,
          metrics
        );
      } else {
        // Create a new report
        const today = new Date();
        // Get the end of the current week (Saturday)
        const weekEndDate = new Date(today);
        const dayOfWeek = today.getDay();
        const daysToAdd = (6 - dayOfWeek) % 7;
        weekEndDate.setDate(today.getDate() + daysToAdd);
        
        await submitWeeklyReport(
          name,
          reportText,
          metrics,
          weekEndDate
        );
      }
      
      setSuccess(true);
      
      // Reset form or redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/');
      }, 800); // Increased delay for smoother transition
    });
  };

  // Function to determine if the user is on track, ahead, or behind for a metric
  const getProgressStatus = (metric: MetricData) => {
    const value = metric.value || 0;
    const target = metric.targetValue || 0;
    
    // For monthly metrics, consider previous progress
    if (metric.frequency === 'Monthly') {
      const progress = monthlyProgress[metric.title];
      if (progress) {
        // Calculate current value + previous progress
        const totalValue = value + progress.value;
        // Calculate progress percentage against monthly target
        const progressPercentage = target > 0 ? (totalValue / target) * 100 : 0;
        
        if (progressPercentage >= 100) return "ahead";
        if (progressPercentage >= 75) return "on-track";
        
        // Calculate weekly target (divide monthly target by 4 weeks)
        // Weekly target calculation - commented out as not currently used
        // target / 4;
        const weekNumber = Math.floor((new Date().getDate() - 1) / 7) + 1;
        
        // By this week, they should have completed (weekNumber/4) of their target
        const expectedProgress = (weekNumber / 4) * target;
        if (totalValue >= expectedProgress) return "on-track";
        return "behind";
      }
    }
    
    // For weekly metrics or if no previous progress data
    const progressPercentage = target > 0 ? (value / target) * 100 : 0;
    
    if (progressPercentage >= 100) return "ahead";
    if (progressPercentage >= 75) return "on-track";
    return "behind";
  };

  // Function to get the appropriate color for the progress status
  const getProgressColor = (status: string) => {
    switch (status) {
      case "ahead": return "text-[#c0ff54]";
      case "on-track": return "text-yellow-400";
      case "behind": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  // Function to get appropriate background color for slider based on progress
  const getSliderColor = (metric: MetricData) => {
    const status = getProgressStatus(metric);
    switch (status) {
      case "ahead": return "#c0ff54";
      case "on-track": return "#fbbf24";
      case "behind": return "#f87171";
      default: return "#d1d5db";
    }
  };

  // Get the current week number (1-4) of the month
  const getCurrentWeekOfMonth = () => {
    const today = new Date();
    return Math.floor((today.getDate() - 1) / 7) + 1;
  };

  // Calculate the suggested value for this week based on monthly target and previous progress
  const getSuggestedWeeklyValue = (metric: MetricData) => {
    if (metric.frequency !== 'Monthly') return 0;
    
    const targetValue = metric.targetValue || 0;
    // Weekly target calculation - commented out as not currently used
    // targetValue / 4;
    const weekNumber = getCurrentWeekOfMonth();
    
    // Previous progress for this metric
    const previousProgress = monthlyProgress[metric.title]?.value || 0;
    
    // How much is still needed for the month
    const remaining = Math.max(0, targetValue - previousProgress);
    
    // How many weeks left in the month (including this one)
    const weeksLeft = 5 - weekNumber;
    
    if (weeksLeft <= 0) return 0;
    
    // Suggested value for this week to stay on track
    return Math.ceil(remaining / weeksLeft);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="text-gray-400 flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-[#c0ff54] mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-labelledby="loadingSpinnerTitle">
            <title id="loadingSpinnerTitle">Loading Spinner</title>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading report data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-[#1a1a1a] rounded-lg shadow-md p-4 sm:p-6 border border-[#333333] relative overflow-hidden">
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
        <div className="flex items-center mb-6">
          <Image 
            src="/Green_on_Transparent_Logo_.png" 
            alt="TERRASYNC Logo" 
            width={180} 
            height={45}
            className="mb-2"
          />
        </div>
        
        {pendingReport && (
          <div className="mb-6 p-3 bg-[#1d2e17] text-[#9adf21] rounded-md border border-[#3b5824] transition-all duration-300 ease-in-out">
            This report was automatically created for the week ending {new Date(pendingReport.weekEndingDate).toLocaleDateString()}.
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-3 bg-[#2c1618] text-[#f88e86] rounded-md border border-[#582427] transition-all duration-300 ease-in-out animate-fadeIn">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-[#1d2e17] text-[#9adf21] rounded-md border border-[#3b5824] transition-all duration-300 ease-in-out animate-fadeIn">
            Report submitted successfully! Redirecting to dashboard...
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <section className="mb-6">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                YOUR NAME
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-[#c0ff54] bg-[#232323] text-white"
                required
              />
            </div>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-[#c0ff54] mb-4">PERFORMANCE METRICS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {metrics.map(metric => {
                const status = getProgressStatus(metric);
                const statusColor = getProgressColor(status);
                const sliderColor = getSliderColor(metric);
                const value = metric.value || 0;
                const targetValue = metric.targetValue || getDefaultTargetValue(metric.title);
                
                // For monthly metrics, calculate cumulative progress
                const previousProgress = metric.frequency === 'Monthly' 
                  ? (monthlyProgress[metric.title]?.value || 0) 
                  : 0;
                  
                const totalValue = value + previousProgress;
                const percentage = targetValue > 0 ? (value / targetValue) * 100 : 0;
                const totalPercentage = targetValue > 0 ? (totalValue / targetValue) * 100 : 0;
                
                // For monthly metrics, calculate suggested weekly value
                const suggestedValue = getSuggestedWeeklyValue(metric);
                
                return (
                  <div key={metric.id} className="bg-[#232323] border border-[#333333] rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium text-gray-200">{metric.title}</div>
                      <div className={`text-xs ${statusColor} font-medium px-2 py-1 rounded-full bg-black/20`}>
                        {status === "ahead" ? "AHEAD OF TARGET" : 
                         status === "on-track" ? "ON TRACK" : "BEHIND TARGET"}
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">
                            {metric.frequency === 'Monthly' 
                              ? `Month Target: ${targetValue}` 
                              : `Week Target: ${targetValue}`}
                          </span>
                          <span className="text-[#c0ff54]">{Math.round(percentage)}%</span>
                        </div>
                        
                        <div className="relative">
                          <input
                            id={`metric-slider-${metric.id}`}
                            type="range"
                            min="0"
                            max={targetValue * 2}
                            value={value}
                            onChange={(e) => handleSliderChange(metric.id, e)}
                            className="slider-input w-full h-3 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, ${sliderColor} 0%, ${sliderColor} ${percentage}%, #333333 ${percentage}%, #333333 100%)`,
                            }}
                          />
                          
                          <style jsx>{`
                            .slider-input::-webkit-slider-thumb {
                              background: ${sliderColor} !important;
                            }
                            .slider-input::-moz-range-thumb {
                              background: ${sliderColor} !important;
                            }
                            .slider-input::-ms-thumb {
                              background: ${sliderColor} !important;
                            }
                          `}</style>

                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-500">0</span>
                            <span className="text-gray-300 font-medium">
                              {value}/{metric.frequency === 'Weekly' ? targetValue : (suggestedValue || Math.round(targetValue / 4))}
                              <span className="text-xs text-gray-500 ml-1">
                                {metric.frequency === 'Weekly' ? '(week)' : '(suggested)'}
                              </span>
                            </span>
                            <span className="text-gray-500">{targetValue*2}</span>
                          </div>
                        </div>
                      </div>
                      
                      {metric.frequency === 'Monthly' && (
                        <div className="mb-4 mt-3 bg-black/20 p-2 rounded">
                          <div className="text-xs text-gray-300 font-medium mb-1">MONTHLY PROGRESS</div>
                          <div className="flex items-center mb-1">
                            <div className="w-full bg-[#333333] rounded-full h-1.5 mr-2">
                              <div 
                                className="bg-[#c0ff54] h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, totalPercentage)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {Math.round(totalPercentage)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Previous: <span className="text-[#9adf21]">{previousProgress}</span></span>
                            <span className="text-gray-400">This week: <span className="text-[#9adf21]">{value}</span></span>
                            <span className="text-gray-400">Total: <span className="text-[#9adf21]">{totalValue}/{targetValue}</span></span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center mt-4">
                        <div className="w-24">
                          <label htmlFor={`metric-value-${metric.id}`} className="text-xs text-gray-400 mb-1 block">
                            Exact Value:
                          </label>
                          <input
                            id={`metric-value-${metric.id}`}
                            type="number"
                            min="0"
                            value={value}
                            onChange={(e) => handleMetricValueChange(metric.id, Number.parseInt(e.target.value, 10) || 0)}
                            className="w-full px-2 py-1 border border-[#333333] rounded-md focus:outline-none focus:ring-1 focus:ring-[#c0ff54] bg-[#1a1a1a] text-white text-right text-sm"
                          />
                        </div>
                        
                        <div className="ml-4 flex-1">
                          <div className="text-xs text-gray-400 mb-1">Tracking Info:</div>
                          <div className="text-xs text-gray-500">{metric.trackingMethod}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-[#c0ff54] mb-4">WEEKLY SUMMARY</h3>
            <div className="mb-4">
              <label htmlFor="report-text" className="block text-sm font-medium text-gray-300 mb-2">
                PROVIDE A SUMMARY OF YOUR WEEKLY ACTIVITIES AND PROGRESS
              </label>
              <textarea
                id="report-text"
                rows={6}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="This week I did X, Y, and Z..."
                className="w-full px-3 py-2 border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-[#c0ff54] bg-[#232323] text-white"
                required
              />
            </div>
          </section>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-[#333333] text-gray-300 rounded-md hover:bg-[#444444] focus:outline-none focus:ring-2 focus:ring-gray-500 order-2 sm:order-1 transition-colors duration-200 ease-in-out"
            >
              BACK TO DASHBOARD
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-4 py-2 bg-[#c0ff54] text-black rounded-md hover:bg-[#9adf21] focus:outline-none focus:ring-2 focus:ring-[#9adf21] disabled:opacity-50 disabled:cursor-not-allowed font-medium order-1 sm:order-2 transition-all duration-200 ease-in-out relative overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-labelledby="submitSpinnerTitle">
                    <title id="submitSpinnerTitle">Submitting</title>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  SUBMITTING...
                </span>
              ) : 'SUBMIT REPORT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 