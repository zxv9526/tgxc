export interface TelegramPhoto {
  id: string;
  title: string;
  description: string;
  url: string;
  album: string;
  tags: string[];
  likes: number;
  views: number;
  author: string;
  date: string;
  timestamp?: number;
  messageId?: string;
  aspectRatio?: string;
}

export interface ChannelConfig {
  channelName: string;
  channelBio: string;
  bannerUrl: string;
  avatarUrl: string;
  totalMembers: string;
  handle: string;
}

export type FilterMode = 'today' | 'all';
export type LayoutMode = 'grid' | 'list';

export interface AiStyleTemplate {
  id: string;
  name: string;
  promptPrefix: string;
  promptSuffix: string;
  badge: string;
  bgGradient: string;
}
