import { type ReactNode } from 'react';

type RoleGateProps = {
  readonly role: 'vendor' | 'admin';
  readonly allow: readonly ('vendor' | 'admin')[];
  readonly children: ReactNode;
};

export default function RoleGate({ role, allow, children }: RoleGateProps) {
  if (allow.includes(role) === false) {
    return null;
  }
  return <>{children}</>;
}

