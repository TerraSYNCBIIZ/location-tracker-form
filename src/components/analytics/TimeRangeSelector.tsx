'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

type TimeRangeOption = {
  id: string;
  label: string;
};

type TimeRangeSelectorProps = {
  onRangeChange: (range: string) => void;
  initialRange?: string;
};

const timeRangeOptions: TimeRangeOption[] = [
  { id: 'month', label: 'MONTH' },
  { id: 'quarter', label: 'QUARTER' },
  { id: 'halfYear', label: '6 MONTHS' },
  { id: 'year', label: 'YEAR' },
];

export const TimeRangeSelector = ({ onRangeChange, initialRange = 'month' }: TimeRangeSelectorProps) => {
  const [selectedRange, setSelectedRange] = useState(initialRange);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    onRangeChange(range);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-3 flex items-center justify-between max-w-xl mx-auto mb-8">
      <div className="relative flex w-full rounded-md bg-[#111111] p-1">
        {timeRangeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`relative flex-1 z-10 py-2 text-xs font-medium transition-all duration-200 rounded-md ${
              selectedRange === option.id ? 'text-black' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => handleRangeChange(option.id)}
          >
            {selectedRange === option.id && (
              <motion.div
                className="absolute inset-0 bg-[#c0ff54] rounded-md"
                layoutId="timeRangeBackground"
                transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                style={{ zIndex: -1 }}
              />
            )}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}; 