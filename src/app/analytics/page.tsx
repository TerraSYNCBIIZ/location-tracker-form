'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from '@/components/Header';
import { TimeRangeSelector } from '@/components/analytics/TimeRangeSelector';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { CompletionRate } from '@/components/analytics/CompletionRate';
import { getMetricsPerformance, getPerformanceByMetric, calculateAchievementPercentage, getReportsForAnalytics } from '@/lib/analyticsServices';
import { DEFAULT_METRICS } from '@/lib/services';
import Image from 'next/image';
import { motion } from 'framer-motion';

type MetricsData = {
  byDate: { date: string; metrics: Record<string, number> }[];
  totals: Record<string, number>;
  averages: Record<string, number>;
  completion: Record<string, number>;
};

type ChartDataItem = {
  title: string;
  color: string;
  data: { date: string; value: number; target: number }[];
};

// Add a debounce utility with better typing
const useDebounce = <T extends (...args: unknown[]) => unknown>(fn: T, delay: number) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]);
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month');
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [achievements, setAchievements] = useState<Record<string, { percentage: number; status: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoize the metric colors to prevent object recreations on each render
  const metricColors = useMemo(() => ({
    'New Accounts Outreach': '#c0ff54', // Neon green
    'Acres Secured': '#54e8ff', // Cyan
    'Quotations Sent': '#ffbe54', // Orange
    'Quotation Closing Rate': '#ff5494', // Pink
  }), []);
  
  // Handler for time range changes
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };
  
  // Fetch data from the database
  const fetchData = useCallback(async () => {
    console.log('Fetching data for time range:', timeRange);
    setIsLoading(true);
    
    try {
      // Fetch reports only once for all operations
      console.log('Fetching reports for analytics with timeRange:', timeRange);
      const reports = await getReportsForAnalytics(timeRange);
      console.log('Reports for analytics:', reports);
      
      if (reports && reports.length > 0) {
        // Cache these values to prevent multiple recalculations
        const achievementData = calculateAchievementPercentage(reports);
        setAchievements(achievementData);
        
        // Batch process metrics performance
        const metricsPerformance = await getMetricsPerformance(timeRange);
        setMetricsData(metricsPerformance);
        console.log('Metrics performance data:', metricsPerformance);
        
        // Fetch detailed data for each metric - using Promise.all for parallel fetching
        const metricsChartData = await Promise.all(
          DEFAULT_METRICS.map(async (metric) => {
            const performance = await getPerformanceByMetric(timeRange, metric.title);
            // Validate and ensure proper data structure
            if (!performance || !performance.data) {
              console.warn(`No performance data for ${metric.title}`);
              return {
                title: metric.title,
                color: metricColors[metric.title as keyof typeof metricColors] || '#c0ff54',
                data: [] // Empty array as fallback
              };
            }
            
            // Ensure all data points have the required fields
            const cleanedData = performance.data.map(point => ({
              date: point.date || new Date().toISOString(),
              value: typeof point.value === 'number' ? point.value : 0,
              target: typeof point.target === 'number' ? point.target : 10
            }));
            
            console.log(`Processed ${cleanedData.length} data points for ${metric.title}`);
            
            return {
              title: metric.title,
              color: metricColors[metric.title as keyof typeof metricColors] || '#c0ff54',
              data: cleanedData,
            };
          })
        );
        
        console.log('Chart data:', metricsChartData);
        console.log('Sample data for first metric:', metricsChartData[0]?.data?.slice(0, 3));
        setChartData(metricsChartData);
      } else {
        // No reports found - set empty data
        console.log('No reports found - setting empty chart data');
        setChartData(DEFAULT_METRICS.map(metric => ({
          title: metric.title,
          color: metricColors[metric.title as keyof typeof metricColors] || '#c0ff54',
          data: []
        })));
        setAchievements({});
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Set empty data on error
      setChartData([]);
      setAchievements({});
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, metricColors]);
  
  // Debounce the fetchData call
  const debouncedFetchData = useDebounce(fetchData, 300);
  
  // Update the useEffect to use the debounced version
  useEffect(() => {
    debouncedFetchData();
  }, [debouncedFetchData]);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-white">
      <Header />
      
      <main className="flex-grow py-8 relative overflow-hidden">
        {/* Background logo with opacity */}
        <div className="absolute inset-0 opacity-5 flex justify-center items-center overflow-hidden pointer-events-none">
          <div className="w-full h-full relative">
            <Image 
              src="/Black_on_Transparent_Logo.png" 
              alt="TERRASYNC Background Logo" 
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <motion.h1 
              className="text-2xl font-bold text-[#c0ff54]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              ANALYTICS
            </motion.h1>
          </div>
          
          {/* Time range selector */}
          <TimeRangeSelector onRangeChange={handleTimeRangeChange} initialRange={timeRange} />
          
          {isLoading ? (
            <div className="flex items-center justify-center p-12 h-96">
              <div className="text-gray-400 flex flex-col items-center">
                <svg className="animate-spin h-10 w-10 text-[#c0ff54] mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-labelledby="loadingSpinnerTitle">
                  <title id="loadingSpinnerTitle">Loading Spinner</title>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading analytics data...
              </div>
            </div>
          ) : (
            <>
              {/* Performance chart */}
              <PerformanceChart metrics={chartData} timeRange={timeRange} />
              
              {/* Achievement Circles */}
              <motion.div 
                className="bg-[#1a1a1a] rounded-lg shadow-sm border border-[#333333] p-6 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <h3 className="text-lg font-medium text-white mb-6">Target Achievement</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {DEFAULT_METRICS.map((metric) => {
                    const achievement = achievements[metric.title] || { percentage: 0, status: 'behind' };
                    const color = metricColors[metric.title as keyof typeof metricColors] || '#c0ff54';
                    
                    return (
                      <CompletionRate 
                        key={metric.title}
                        percentage={achievement.percentage}
                        label={metric.title}
                        color={color}
                      />
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
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