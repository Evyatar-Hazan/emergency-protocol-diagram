export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  ADMIN_EMAIL?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  isAdmin: boolean;
}
