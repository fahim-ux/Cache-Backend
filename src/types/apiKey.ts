// API Key type definition
export interface ApiKey {
  id?: string;
  key: string;
  userId: string;
  name?: string;
  createdAt: Date;
  lastUsed?: Date;
  active: boolean;
  expiresAt?: Date;
}

// Extend Express Request to include API key
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey;
      user?: any;
    }
  }
}