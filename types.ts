export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type AgingStyle = 'rustico' | 'natural' | 'elegante';

export interface ImageState {
  original: string | null;
  generated: string | null;
}

export interface APIError {
  message: string;
  details?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  originalUrl: string;
  generatedUrl: string;
  description: string;
  style?: AgingStyle;
}

export type ViewState = 'landing' | 'login' | 'register' | 'dashboard' | 'generator';