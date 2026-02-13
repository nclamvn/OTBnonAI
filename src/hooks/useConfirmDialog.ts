import { useState, useCallback } from 'react';

interface ConfirmState {
  open: boolean;
  message: string;
  title?: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
}

const INITIAL: ConfirmState = {
  open: false,
  message: '',
  onConfirm: () => {},
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>(INITIAL);

  const confirm = useCallback((opts: {
    message: string;
    title?: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
  }) => {
    setState({ open: true, ...opts });
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    setState(INITIAL);
  }, [state]);

  const handleCancel = useCallback(() => {
    setState(INITIAL);
  }, []);

  return {
    dialogProps: {
      open: state.open,
      message: state.message,
      title: state.title,
      confirmLabel: state.confirmLabel,
      variant: state.variant,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
    confirm,
  };
}
