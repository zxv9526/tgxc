export interface TelegramPhoto {
  id: string;
  title: string;
  description: string;
  url: string;
  album?: string;
  tags?: string[];
  likes?: number;
  views?: number;
  author?: string;
  date: string;
  timestamp?: number;
  aspectRatio?: string;
  telegramUrl?: string;
  messageId?: string;
}

export interface BlogPost {
  id: string;
  messageId: string;
  title: string;
  content: string;
  photos: string[];
  date: string;
  timestamp: number;
  views: number;
  likes: number;
  tags: string[];
  telegramUrl: string;
  author: string;
}

export interface TelegramChannelInfo {
  channelName: string;
  channelBio: string;
  avatarUrl: string;
  bannerUrl: string;
  totalMembers?: string;
  handle: string;
}
