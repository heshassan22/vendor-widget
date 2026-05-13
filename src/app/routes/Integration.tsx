import { useEffect, useState } from 'react';
import { CodeBlock } from '@/components/common';
import {
  getSnippet,
  listLoyaltyEvents,
  subscribeLiveEvents,
  type LoyaltyEvent,
} from '@/lib/api';
import { useActiveTenant } from '@/app/auth';
import { Badge, Button, Card, Typography } from 'components/elements';

const MAX_EVENTS = 50;

export default function Integration() {
  const { id: tenantId } = useActiveTenant();
  const [snippet, setSnippet] = useState<string>('');
  const [domainScript, setDomainScript] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [events, setEvents] = useState<readonly LoyaltyEvent[]>([]);
  const [streamState, setStreamState] = useState<'connecting' | 'live' | 'error'>('connecting');

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    void getSnippet(tenantId)
      .then((data) => {
        setSnippet(data.snippet);
        setDomainScript(data.domainScript);
      })
      .catch(() => undefined);
  }, [tenantId]);

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    void listLoyaltyEvents(tenantId, MAX_EVENTS).then((rows) => setEvents(rows));
    let stop: (() => void) | null = null;
    try {
      stop = subscribeLiveEvents(tenantId, (event) => {
        setStreamState('live');
        setEvents((prev) => {
          const next = [event, ...prev.filter((e) => e.id !== event.id)];
          return next.slice(0, MAX_EVENTS);
        });
      });
    } catch {
      setStreamState('error');
    }
    return () => {
      stop?.();
    };
  }, [tenantId]);

  const onCopy = async (): Promise<void> => {
    if (snippet.length === 0) {
      return;
    }
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          One-script integration
        </Typography>
        {snippet.length === 0 ? (
          <Typography className="text-sm text-slate-500">Generating snippet…</Typography>
        ) : (
          <>
            <CodeBlock code={snippet} />
            <div className="flex gap-2">
              <Button onClick={() => void onCopy()}>{copied ? 'Copied' : 'Copy embed snippet'}</Button>
              <Badge>{domainScript}</Badge>
            </div>
            <Typography className="text-xs text-slate-500">
              Paste this into the &lt;head&gt; of any vendor product page. The widget renders only on
              pages whose JSON-LD/OpenGraph product matches your detection rules.
            </Typography>
          </>
        )}
      </Card>
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <Typography as="h3" className="text-lg font-semibold text-slate-900">
            Install validator stream
          </Typography>
          <Badge
            className={
              streamState === 'live'
                ? 'bg-green-100 text-green-700'
                : streamState === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-700'
            }
          >
            {streamState === 'live' ? 'live' : streamState === 'error' ? 'disconnected' : 'connecting'}
          </Badge>
        </div>
        {events.length === 0 ? (
          <Typography className="text-sm text-slate-500">
            No events yet. Open the demo page or paste your snippet on a real product page; events
            stream in here in real time.
          </Typography>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-[120px_140px_1fr_80px] items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"
              >
                <span className="font-mono text-xs text-slate-500">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </span>
                <span className="font-medium">{event.type}</span>
                <span className="truncate text-slate-600">
                  {event.sku ?? '—'} {event.customerId === null ? '' : `· ${event.customerId}`}
                </span>
                <span className="text-right">{event.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
