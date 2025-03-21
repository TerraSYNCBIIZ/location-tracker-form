'use client';

import { motion } from 'framer-motion';

type CompletionRateProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
};

export const CompletionRate = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  label,
  color = '#c0ff54',
}: CompletionRateProps) => {
  // Calculate radius and circumference
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (percentage / 100) * circumference;
  
  // Determine status color based on percentage
  const getStatusColor = () => {
    if (percentage >= 100) return color;
    if (percentage >= 75) return '#FFA63D';
    return '#FF5E7A';
  };
  
  const statusColor = color === '#c0ff54' ? getStatusColor() : color;
  
  console.log(`CompletionRate for ${label}: ${percentage}%, offset: ${progressOffset}/${circumference}, color: ${statusColor}`);
  
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} className="rotate-[-90deg]" aria-labelledby="completionRateTitle">
          <title id="completionRateTitle">Completion Rate: {Math.round(percentage)}%</title>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#333333"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={statusColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progressOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        
        {/* Percentage text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {Math.round(percentage)}%
          </motion.span>
          
          {label && (
            <motion.span 
              className="text-xs text-gray-400 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              {label}
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}; 