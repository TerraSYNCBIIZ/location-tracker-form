'use client';

import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

type MetricSummaryCardProps = {
  title: string;
  value: number;
  target: number;
  previousValue?: number;
  isCompact?: boolean;
};

export const MetricSummaryCard = ({
  title,
  value,
  target,
  previousValue,
  isCompact = false,
}: MetricSummaryCardProps) => {
  // Calculate percentage of target achieved
  const percentage = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  
  // Determine status based on percentage
  let status: 'ahead' | 'on-track' | 'behind' = 'behind';
  if (percentage >= 100) {
    status = 'ahead';
  } else if (percentage >= 75) {
    status = 'on-track';
  }
  
  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'ahead':
        return 'text-[#c0ff54]';
      case 'on-track':
        return 'text-yellow-400';
      case 'behind':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };
  
  // Get status label
  const getStatusLabel = () => {
    switch (status) {
      case 'ahead':
        return 'AHEAD';
      case 'on-track':
        return 'ON TRACK';
      case 'behind':
        return 'BEHIND';
      default:
        return '';
    }
  };
  
  // Calculate trend if previous value is provided
  const getTrend = () => {
    if (previousValue === undefined) return null;
    
    const diff = value - previousValue;
    const percentChange = previousValue > 0 ? (diff / previousValue) * 100 : 0;
    
    if (Math.abs(percentChange) < 1) return null;
    
    return {
      direction: diff >= 0 ? 'up' : 'down',
      percentage: Math.abs(percentChange).toFixed(1),
    };
  };
  
  const trend = getTrend();
  
  return (
    <motion.div 
      className={`bg-[#1a1a1a] rounded-lg shadow-sm border border-[#333333] overflow-hidden ${
        isCompact ? 'p-3' : 'p-4'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-medium text-gray-300 ${isCompact ? 'text-sm' : 'text-base'}`}>{title}</h3>
        <div className={`${getStatusColor()} rounded-full px-2 py-1 text-xs font-medium bg-black/20`}>
          {getStatusLabel()}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline">
            <span className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold text-white`}>
              {value.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 ml-1">
              / {target.toLocaleString()}
            </span>
          </div>
          
          {trend && (
            <div className={`flex items-center text-xs font-medium ${
              trend.direction === 'up' ? 'text-[#c0ff54]' : 'text-red-400'
            }`}>
              {trend.direction === 'up' ? (
                <ArrowUpIcon className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 mr-1" />
              )}
              {trend.percentage}%
            </div>
          )}
        </div>
        
        <div className="mt-2 relative h-2 bg-[#222222] rounded-full overflow-hidden">
          <motion.div 
            className={`absolute top-0 left-0 h-full rounded-full ${
              status === 'ahead' ? 'bg-[#c0ff54]' : 
              status === 'on-track' ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
      
      {!isCompact && (
        <div className="text-xs text-gray-400">
          {percentage.toFixed(1)}% of target
        </div>
      )}
    </motion.div>
  );
}; 