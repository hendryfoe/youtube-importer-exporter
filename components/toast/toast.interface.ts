export interface ToastFactoryPayload {
  add: (message: string) => void;
  close: (toastId: number) => void;
  closeAll?: () => void;
}

export interface ToastPayload {
  id: number;
  message: string;
}

export interface ToastProps {
  payload: ToastPayload;
  onClose: (id: number) => void;
  delay?: number;
}
