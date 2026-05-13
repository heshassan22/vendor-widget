import { useMemo, useRef, useState } from 'react';
import { CodeBlock } from '@/components/common';
import { Button, Card, Typography } from 'components/elements';
import { cn } from '@/lib/utils';

type ViewMode = 'split' | 'before' | 'after' | 'diff';

const beforeUrl = '/demo/before.html';
const afterUrl = '/demo/after.html';
const integrationLine = `+ <script src="/widget/loader.js" data-domain-script="t_8f3a-store.vendor.com" type="module"></script>`;

const modes: readonly { readonly id: ViewMode; readonly label: string }[] = [
  { id: 'split', label: 'Side-by-side' },
  { id: 'before', label: 'Before only' },
  { id: 'after', label: 'After only' },
  { id: 'diff', label: 'Diff' },
];

type FrameProps = {
  readonly title: string;
  readonly src: string;
  readonly accent: 'neutral' | 'success';
  readonly cacheKey: number;
};

function DemoFrame({ title, src, accent, cacheKey }: FrameProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className={cn(
          'flex items-center justify-between border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide',
          accent === 'success'
            ? 'border-green-100 bg-green-50 text-green-700'
            : 'border-slate-100 bg-slate-50 text-slate-600',
        )}
      >
        <span>{title}</span>
        <span className="font-mono text-[11px] normal-case">{src}</span>
      </div>
      <iframe
        key={`${src}-${cacheKey}`}
        title={title}
        src={`${src}?r=${cacheKey}`}
        className="h-full w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}

export default function Demo() {
  const [mode, setMode] = useState<ViewMode>('split');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onReload = (): void => {
    setReloadKey((value) => value + 1);
  };

  const onOpen = (url: string): void => {
    window.open(url, '_blank', 'noopener');
  };

  const description = useMemo(() => {
    if (mode === 'diff') {
      return 'Literal source diff between before.html and after.html.';
    }
    if (mode === 'split') {
      return 'Same Dove product page rendered twice. Right side has one extra <script> tag in <head>.';
    }
    if (mode === 'before') {
      return 'Plain product page with no widget integration.';
    }
    return 'Same page with the one-line widget loader added in <head>.';
  }, [mode]);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <Typography as="h3" className="text-lg font-semibold text-slate-900">
            Live integration demo
          </Typography>
          <Typography className="text-sm text-slate-500">{description}</Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {modes.map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  mode === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={onReload}>
            Reload
          </Button>
          <Button variant="secondary" onClick={() => onOpen(beforeUrl)}>
            Open before
          </Button>
          <Button onClick={() => onOpen(afterUrl)}>Open after</Button>
        </div>
      </Card>

      <div ref={containerRef} className="min-h-0 flex-1">
        {mode === 'split' && (
          <div className="grid h-full grid-cols-2 gap-4">
            <DemoFrame title="Before integration" src={beforeUrl} accent="neutral" cacheKey={reloadKey} />
            <DemoFrame title="After integration" src={afterUrl} accent="success" cacheKey={reloadKey} />
          </div>
        )}

        {mode === 'before' && (
          <div className="grid h-full grid-cols-1">
            <DemoFrame title="Before integration" src={beforeUrl} accent="neutral" cacheKey={reloadKey} />
          </div>
        )}

        {mode === 'after' && (
          <div className="grid h-full grid-cols-1">
            <DemoFrame title="After integration" src={afterUrl} accent="success" cacheKey={reloadKey} />
          </div>
        )}

        {mode === 'diff' && (
          <Card className="h-full space-y-4 overflow-y-auto">
            <Typography as="h3" className="text-lg font-semibold text-slate-900">
              Source diff: before.html vs after.html
            </Typography>
            <Typography className="text-sm text-slate-600">
              The two pages are byte-for-byte identical apart from a single line added in the document head. That is the entire client integration.
            </Typography>
            <CodeBlock code={integrationLine} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="bg-slate-50">
                <Typography as="h3" className="text-sm font-semibold text-slate-900">
                  No build step
                </Typography>
                <Typography className="text-xs text-slate-600">
                  Pure HTML. Works on static sites, Shopify, WordPress, React, Angular, Vue, Next.js, anything with a head tag.
                </Typography>
              </Card>
              <Card className="bg-slate-50">
                <Typography as="h3" className="text-sm font-semibold text-slate-900">
                  Inverse auto-blocking
                </Typography>
                <Typography className="text-xs text-slate-600">
                  The widget reads JSON-LD Product schema and only renders when the SKU/brand is in the tenant rule set. Non-Unilever pages stay clean.
                </Typography>
              </Card>
              <Card className="bg-slate-50">
                <Typography as="h3" className="text-sm font-semibold text-slate-900">
                  Sandboxed UI
                </Typography>
                <Typography className="text-xs text-slate-600">
                  The widget renders in Shadow DOM. Zero CSS leak in either direction, no host-page conflicts.
                </Typography>
              </Card>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
