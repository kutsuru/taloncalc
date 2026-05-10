export type TTSnackbarSeverity = 'default' | 'success' | 'error' | 'warning' | 'info' | 'debug';

export interface TTSnackbarMessage {
  id: string;
  message: string;
  severity?: TTSnackbarSeverity;
  duration?: number;
  action?: {
    label: string;
    onClick?: () => void;
  };
}