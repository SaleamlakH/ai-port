export interface Developer {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeveloperRepository {
  create(email: string): Promise<Developer>;
  findByEmail(email: string): Promise<Developer | null>;
}

export interface ApiKey {
  id: string;
  developerId: string;
  keyHash: string;
  label: string;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyRepository {
  create: (developerId: string, keyHash: string, label: string) => Promise<ApiKey>;
  findByKeyHash(keyHash: string): Promise<ApiKey | null>;
  revoke(id: string): Promise<ApiKey>;
}
