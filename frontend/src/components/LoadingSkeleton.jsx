import React from 'react';
import { motion } from 'framer-motion';

export const CardSkeleton = () => {
  return (
    <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
      <div className="h-48 bg-surface-container relative overflow-hidden">
        <motion.div
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-surface-container rounded animate-pulse" />
        <div className="h-4 bg-surface-container rounded w-3/4 animate-pulse" />
        <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
          <div className="h-3 bg-surface-container rounded w-20 animate-pulse" />
          <div className="h-8 bg-surface-container rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const StatSkeleton = () => {
  return (
    <div className="bg-surface-container rounded-xl p-6 text-center border border-outline-variant shadow-sm">
      <div className="h-8 bg-surface-container-high rounded w-16 mx-auto mb-2 animate-pulse" />
      <div className="h-4 bg-surface-container-high rounded w-24 mx-auto animate-pulse" />
    </div>
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
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} border-2 border-primary border-t-transparent rounded-full`}
    />
  );
};

export default { CardSkeleton, StatSkeleton, LoadingSpinner };
