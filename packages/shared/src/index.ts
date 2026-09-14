export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export type HealthCheckResponse = {
  appName: string;
  status: 'ok';
  environment: string;
  timestamp: string;
};

export const APP_NAME = 'SmartStudy AI';
export const DEFAULT_ENVIRONMENT = 'development';
