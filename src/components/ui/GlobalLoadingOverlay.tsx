'use client';
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

const GlobalLoadingOverlay: React.FC = () => {
  const { loading } = useAppContext();

  if (!loading.visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        {loading.message && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{loading.message}</p>
        )}
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;
