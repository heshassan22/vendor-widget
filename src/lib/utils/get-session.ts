type SessionData = {
  email: string;
  role: 'vendor' | 'admin';
  userId: string;
  tenantId: string | null;
};

export type { SessionData };
