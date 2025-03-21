'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type DataPoint = {
  date: string;
  value: number;
  target?: number;
};

type MetricData = {
  title: string;
  color: string;
  data: DataPoint[];
};

type PerformanceChartProps = {
  metrics: MetricData[];
  timeRange: string;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  activeMetricData?: MetricData;
};

// Helper function to format dates based on time range
function formatDateString(dateStr: string, timeRange: string): string {
  try {
    const date = new Date(dateStr);
    let options: Intl.DateTimeFormatOptions = {};
    
    switch (timeRange) {
      case 'year':
        options = { month: 'short' }; // Monthly for year
        break;
      case 'month':
        options = { month: 'short', day: 'numeric' }; // Daily for month
        break;
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return dateStr;
  }
}

// Calculate the average target achievement percentage
function calculateAverageTargetAchievement(data: DataPoint[]): number {
  if (!data || data.length === 0) return 0;
  
  const validPoints = data.filter(point => 
    typeof point.value === 'number' && 
    typeof point.target === 'number' && 
    point.target > 0
  );
  
  if (validPoints.length === 0) return 0;
  
  // Calculate individual percentages
  const percentages = validPoints.map(point => 
    (point.value / (point.target || 1)) * 100
  );
  
  // Calculate the average
  const sum = percentages.reduce((acc, val) => acc + val, 0);
  return sum / percentages.length;
}

export const PerformanceChart = ({ metrics, timeRange }: PerformanceChartProps) => {
  const [activeMetricIndex, setActiveMetricIndex] = useState<number | null>(
    metrics && metrics.length > 0 ? 0 : null
  );
  
  // Initialize or update active metric when metrics change
  useEffect(() => {
    if (metrics.length > 0) {
      if (activeMetricIndex === null) {
        setActiveMetricIndex(0);
      }
    } else {
      setActiveMetricIndex(null);
    }
  }, [metrics, activeMetricIndex]);
  
  // Get the active metric data
  const activeMetricData = activeMetricIndex !== null 
    ? metrics.find(m => m.title === metrics[activeMetricIndex]?.title)
    : metrics[0];
  
  // Add debugging logs to see what data is being processed
  useEffect(() => {
    if (activeMetricData) {
      console.log('Active Metric:', activeMetricData.title);
      console.log('Raw Data:', activeMetricData.data);
    }
  }, [activeMetricData]);
  
  // Process and prepare data for visualization
  const processedData = useMemo(() => {
    if (!activeMetricData) {
      console.log('No active metric data');
      return [];
    }
    
    // If no data or empty array, return empty array - don't use dummy data
    if (!activeMetricData.data || !Array.isArray(activeMetricData.data) || activeMetricData.data.length === 0) {
      console.log('No valid data found');
      return [];
    }
    
    // Ensure data is an array
    if (!Array.isArray(activeMetricData.data)) {
      console.error('Data is not an array:', activeMetricData.data);
      return [];
    }
    
    // Create a copy of data to avoid modifying the original
    const dataArray = [...activeMetricData.data];
    
    // Sort chronologically
    const sortedData = dataArray.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Process data based on time range
    let aggregatedData = sortedData;
    
    if (timeRange === 'month') {
      // For month view, we need exactly 4 data points (weekly reports)
      // If we have less than 4, we'll keep what we have
      // If we have more than 4, take the 4 most recent ones
      if (sortedData.length > 4) {
        aggregatedData = sortedData.slice(-4);
      }
      console.log(`Month view: Using ${aggregatedData.length} data points out of ${sortedData.length} available points`);
    } else if (timeRange === 'quarter') {
      // For quarter, use the data as-is, typically representing 12-13 weeks
      console.log(`Quarter view: Using ${sortedData.length} data points`);
    } else if (timeRange === 'halfYear') {
      // For half year, use the data as-is, typically with bi-weekly interval
      console.log(`Half year view: Using ${sortedData.length} data points`);
    } else if (timeRange === 'year') {
      // For year, use the data as-is, typically with monthly interval
      console.log(`Year view: Using ${sortedData.length} data points`);
    }
    
    // Map and transform data
    const result = aggregatedData.map(point => ({
      ...point,
      // Ensure value is a number
      value: typeof point.value === 'number' ? point.value : 0,
      // Ensure target is a number if it exists
      target: typeof point.target === 'number' ? point.target : 10,
      // Add formatted date
      formattedDate: formatDateString(point.date, timeRange)
    }));
    
    console.log('Processed Data:', result);
    return result;
  }, [activeMetricData, timeRange]);
  
  // These functions will be implemented in future development
  /*
  function aggregateDataByWeeks(data: DataPoint[], targetWeeks: number, weeksPerBucket = 1): DataPoint[] {
    // Implementation
    return [];
  }

  function aggregateByMonth(data: DataPoint[]): DataPoint[] {
    // Implementation
    return [];
  }
  */
  
  // Return loading state or empty state if no data
  if (!metrics.length) {
    return <EmptyState message="No metrics available" />;
  }
  
  if (!activeMetricData) {
    return <EmptyState message="Select a metric to view" />;
  }
  
  if (!processedData.length) {
    return <EmptyState message="No data available for the selected time period" />;
  }

  // Add extra shine effect to the chart
  const getGradientColors = () => {
    const color = activeMetricData.color;
    // Brighten the color for the top of the gradient
    const lightenColor = (color: string, percent: number) => {
      const num = Number.parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
      const B = Math.min(255, (num & 0x0000FF) + amt);
      return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    };
    
    return {
      topColor: lightenColor(color, 20),
      color: color
    };
  };
  
  const { topColor, color } = getGradientColors();

  return (
    <motion.div 
      className="bg-[#1a1a1a] rounded-lg shadow-md border border-[#333333] p-4 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h3 className="text-lg font-medium text-white">Performance Trends</h3>
        
        <div className="flex flex-wrap gap-2 max-w-full">
          {metrics.map((metric, index) => (
            <button
              key={metric.title}
              type="button"
              onClick={() => setActiveMetricIndex(index)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all duration-300 whitespace-nowrap 
                ${activeMetricIndex === index 
                  ? 'text-black font-medium shadow-lg scale-105'
                  : 'bg-[#222222] text-gray-400 hover:bg-[#333333] hover:text-white'
                }`}
              style={{ 
                backgroundColor: activeMetricIndex === index ? metric.color : undefined,
                boxShadow: activeMetricIndex === index ? `0 0 10px ${metric.color}40` : undefined
              }}
            >
              {metric.title}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeMetricData.title}
          className="h-80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={processedData}
              margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
            >
              <defs>
                <linearGradient id={`gradient-${activeMetricData.title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={topColor} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.2} />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={activeMetricData.color} floodOpacity="0.3" />
                </filter>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              <CartesianGrid stroke="#333333" strokeDasharray="3 3" vertical={false} />
              
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fill: '#999999', fontSize: 11 }}
                axisLine={{ stroke: '#444444' }}
                tickLine={{ stroke: '#444444' }}
                padding={{ left: 10, right: 10 }}
                interval="preserveStartEnd"
                angle={-20}
                textAnchor="end"
                height={50}
              />
              
              <YAxis 
                tick={{ fill: '#999999', fontSize: 11 }}
                axisLine={{ stroke: '#444444' }}
                tickLine={{ stroke: '#444444' }}
                width={40}
                domain={[0, (dataMax: number) => Math.max(dataMax * 1.2, 10)]}
                allowDataOverflow={false}
                tickCount={5}
                minTickGap={10}
              />
              
              <Tooltip
                content={<CustomTooltip activeMetricData={activeMetricData} />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              />
              
              {/* Area for visual weight */}
              <Area
                type="monotone"
                dataKey="value"
                name={activeMetricData.title}
                stroke="none"
                fillOpacity={1}
                fill={`url(#gradient-${activeMetricData.title})`}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
              
              {/* Line for precision */}
              <Line
                type="monotone"
                dataKey="value"
                name={activeMetricData.title}
                stroke={activeMetricData.color}
                strokeWidth={3}
                activeDot={{ 
                  r: 10, 
                  fill: '#FFFFFF',
                  stroke: activeMetricData.color,
                  strokeWidth: 2,
                  filter: 'url(#shadow)'
                }}
                dot={{ 
                  r: 6, 
                  fill: activeMetricData.color,
                  stroke: '#111111',
                  strokeWidth: 1,
                  filter: 'url(#glow)'
                }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
              
              {processedData.some(d => d.target !== undefined && d.target > 0) && (
                <Line
                  type="monotone"
                  dataKey="target"
                  name={`${activeMetricData.title} Target`}
                  stroke="#AAAAAA"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                />
              )}
              
              <Legend
                verticalAlign="top"
                height={36}
                content={<CustomLegend activeMetric={activeMetricData} />}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// Custom components
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111111] border border-[#444444] rounded-md p-3 shadow-xl text-sm">
        <p className="text-gray-300 mb-2 font-medium">{label}</p>
        {payload.map((entry, index) => (
          <div key={`tooltip-item-${entry.name}-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300">{entry.name}: </span>
            <span className="text-white font-medium">
              {Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ activeMetric }: { activeMetric: MetricData }) => {
  const averageAchievement = calculateAverageTargetAchievement(activeMetric.data);
  const formattedAchievement = averageAchievement.toFixed(1);
  
  return (
    <div className="flex flex-wrap justify-between gap-4 pb-1 px-2 text-xs">
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: activeMetric.color }}
        />
        <span className="text-white">{activeMetric.title}</span>
        {averageAchievement > 0 && (
          <span className="text-gray-300 ml-2">
            Avg. Achievement: <span className="text-white font-medium">{formattedAchievement}%</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div className="w-6 h-[2px] bg-[#AAAAAA] dash-line" />
        <span className="text-gray-300">Target</span>
      </div>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => {
  return (
    <motion.div 
      className="bg-[#1a1a1a] rounded-lg shadow-sm border border-[#333333] p-8 overflow-hidden text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-lg font-medium text-white mb-4">Performance Trends</h3>
      <p className="text-gray-400">{message}</p>
      <p className="text-gray-500 text-sm mt-2">
        No data is currently available. To see data in this chart, 
        weekly reports need to be submitted. Each report contributes data 
        for the performance metrics analysis.
      </p>
      <p className="text-gray-500 text-sm mt-2">
        Select a different time range to see if data is available, or 
        ensure weekly reports are being submitted regularly.
      </p>
    </motion.div>
  );
}; 