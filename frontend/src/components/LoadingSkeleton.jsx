import React from 'react';
import { motion } from 'framer-motion';

// Reusable shimmer bar
const ShimmerBar = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded-lg bg-surface-container-high/60 ${className}`}>
    <motion.div
      animate={{ x: ['-100%', '200%'] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
    />
  </div>
);

export const CardSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-hidden shadow-sm"
    >
      {/* Image area */}
      <div className="h-48 relative overflow-hidden bg-surface-container-high/40">
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />
        {/* Fake badge */}
        <div className="absolute top-3 left-3">
          <ShimmerBar className="h-6 w-20 rounded-full" />
        </div>
      </div>
      {/* Content area */}
      <div className="p-5 space-y-3">
        <ShimmerBar className="h-5 w-3/4" />
        <ShimmerBar className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
          <ShimmerBar className="h-3 w-20" />
          <ShimmerBar className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
};

export const StatSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container-low rounded-2xl p-6 text-center border border-outline-variant/40 shadow-sm flex flex-col items-center gap-3"
    >
      <ShimmerBar className="w-12 h-12 rounded-xl" />
      <ShimmerBar className="h-8 w-16" />
      <ShimmerBar className="h-4 w-24" />
    </motion.div>
  );
};

export const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeClasses[size]} border-2 border-primary border-t-transparent rounded-full`}
    />
  );
};

export default { CardSkeleton, StatSkeleton, LoadingSpinner };
