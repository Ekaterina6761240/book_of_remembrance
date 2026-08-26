export type UserRole = 'editor' | 'administrator';

export type User = {
  id: number;
  username: string;
  displayName: string;
  email?: string;
  role: UserRole;
};
