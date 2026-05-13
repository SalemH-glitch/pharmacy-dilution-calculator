export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  credentials: string | null;
  created_at: string;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  credentials?: string;
}

export interface SafeUser {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  credentials: string | null;
  created_at: string;
}
