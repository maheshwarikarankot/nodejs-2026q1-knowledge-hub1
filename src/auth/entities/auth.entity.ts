export interface AuthEntity {
  id: string; // uuid v4
  login: string;
  role: 'admin' | 'editor' | 'viewer';
}
