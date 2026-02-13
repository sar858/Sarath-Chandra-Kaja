
export enum AppView {
  CHAT = 'CHAT',
  IMAGE_GEN = 'IMAGE_GEN',
  VIDEO_GEN = 'VIDEO_GEN',
  LIVE_VOICE = 'LIVE_VOICE'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string;
}

export interface GenerationStatus {
  state: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}
