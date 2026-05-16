export interface Developer {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeveloperRepository {
  create(email: string, password: string): Promise<Developer>;
  findByEmail(email: string): Promise<Developer | null>;
}

export interface DeveloperService {
  create: (email: string, password: string) => Promise<Developer>;
  findByEmail: (email: string) => Promise<Developer>;
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
  revoke(developerId: string, id: string): Promise<ApiKey>;
}

export interface ApiKeyService {
  generate: (developerId: string, label: string) => Promise<string>;
  findByKeyHash: (rawKey: string) => Promise<ApiKey>;
  revoke: (developerId: string, apiKey: ApiKey) => Promise<ApiKey>;
}

export interface AuthService {
  signup(email: string, password: string): Promise<string>;
  login(email: string, password: string): Promise<string>;
}
