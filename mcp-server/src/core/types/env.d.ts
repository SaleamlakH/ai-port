declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    PORT: string;
    JWT_SECRET_KEY: string;
  }
}
