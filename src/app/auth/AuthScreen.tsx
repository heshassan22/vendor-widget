import { useState, type FormEvent } from 'react';
import { Button, Card, Input, Typography } from 'components/elements';

type AuthScreenProps = {
  readonly onLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
};

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await onLogin(email, password);
    setSubmitting(false);
    if (result.ok === false) {
      setError(result.error ?? 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md space-y-5">
        <div className="text-center">
          <Typography as="h1" className="text-2xl font-bold text-slate-900">
            Vendor Widget Portal
          </Typography>
          <Typography className="mt-2 text-sm text-slate-500">
            Sign in to manage tenants, configs, and live loyalty events.
          </Typography>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Typography as="label" className="text-sm font-medium text-slate-700">
              Email
            </Typography>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Typography as="label" className="text-sm font-medium text-slate-700">
              Password
            </Typography>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error !== null && (
            <Typography className="text-sm text-red-600">{error}</Typography>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
