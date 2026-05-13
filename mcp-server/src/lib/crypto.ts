import crypto from 'crypto';

export const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashApiKey = (rawKey: string): string => {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
};
