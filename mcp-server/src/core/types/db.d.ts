export interface Developer {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  developerId: string;
  keyHash: string;
  label: string;
  revokedAt: Date | null;
  createdAt: Date;
}
