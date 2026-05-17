import React, { useState, createContext, useContext, useCallback } from 'react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};

const ConfirmDialog = ({ config, onResult }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleResult = (result) => {
    setIsClosing(true);
    setTimeout(() => onResult(result), 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center p-4 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => handleResult(false)}
      />
      {/* Dialog */}
      <div
        className={`relative bg-surface rounded-2xl shadow-2xl border border-outline-variant w-full max-w-[400px] overflow-hidden ${isClosing ? 'animate-modal-exit' : 'animate-modal-enter'}`}
      >
        {/* Icon & Title */}
        <div className="pt-8 pb-2 px-6 flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            config.type === 'danger'
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            <span
              className={`material-symbols-outlined text-[28px] ${
                config.type === 'danger' ? 'text-red-500' : 'text-blue-500'
              }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {config.type === 'danger' ? 'delete_forever' : 'help'}
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
            {config.title || 'Konfirmasi'}
          </h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            {config.message}
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 pt-6 flex gap-3">
          <button
            onClick={() => handleResult(false)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-low transition-colors active:scale-[0.97]"
          >
            {config.cancelText || 'Batal'}
          </button>
          <button
            onClick={() => handleResult(true)}
            className={`flex-1 px-4 py-2.5 rounded-xl font-label-md transition-colors active:scale-[0.97] ${
              config.type === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            {config.confirmText || 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConfirmProvider = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState(null);
  const [resolveRef, setResolveRef] = useState(null);

  const confirm = useCallback(({ title, message, confirmText, cancelText, type = 'danger' }) => {
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
      setDialogConfig({ title, message, confirmText, cancelText, type });
    });
  }, []);

  const handleResult = (result) => {
    if (resolveRef) resolveRef(result);
    setDialogConfig(null);
    setResolveRef(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialogConfig && (
        <ConfirmDialog config={dialogConfig} onResult={handleResult} />
      )}
    </ConfirmContext.Provider>
  );
};
