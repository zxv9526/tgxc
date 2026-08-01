export interface TelegramPhoto {
  id: string;
  title: string;
  description: string;
  url: string;
  date: string;
  timestamp?: number;
  messageId?: string;
}

export type FilterMode = 'today' | 'all';
