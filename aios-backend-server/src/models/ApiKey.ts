export interface ApiKey {
  id: string;
  userId: string;
  provider: ApiProvider;
  encryptedKey: string;
  name?: string;
  isActive: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ApiProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  OTHER = 'other',
}

export const apiKeyConverter = {
  toFirestore: (apiKey: ApiKey) => {
    return {
      ...apiKey,
      lastUsed: apiKey.lastUsed || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },
  fromFirestore: (snapshot: any): ApiKey => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      lastUsed: data.lastUsed?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    };
  }
}; 