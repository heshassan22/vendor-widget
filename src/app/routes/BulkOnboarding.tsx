import { useState } from 'react';
import { CsvDropzone, CodeBlock } from '@/components/common';
import { bulkCreateTenants, type BulkRow, type CreatedTenant } from '@/lib/api';
import { Button, Card, Typography } from 'components/elements';

function parseCsv(text: string): BulkRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) {
    return [];
  }
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const indexOf = (col: string): number => header.indexOf(col);
  const nameIdx = indexOf('name');
  const brandIdx = indexOf('brand');
  const domainIdx = indexOf('domain');
  const planIdx = indexOf('plan');
  const rows: BulkRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(',').map((c) => c.trim());
    const name = cells[nameIdx] ?? '';
    const brand = cells[brandIdx] ?? '';
    const domain = cells[domainIdx] ?? '';
    if (name.length === 0 || brand.length === 0 || domain.length === 0) {
      continue;
    }
    const plan = planIdx >= 0 ? cells[planIdx] : undefined;
    rows.push({
      name,
      brand,
      domain,
      plan: plan === 'starter' || plan === 'growth' || plan === 'enterprise' ? plan : undefined,
    });
  }
  return rows;
}

export default function BulkOnboarding() {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [created, setCreated] = useState<readonly CreatedTenant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFile = async (file: File): Promise<void> => {
    setError(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      setError('No valid rows. Expected columns: name, brand, domain, plan.');
      return;
    }
    setRows(parsed);
  };

  const onCreate = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await bulkCreateTenants(rows);
      setCreated(result);
      setRows([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSnippets = (): void => {
    const lines = created.map((t) => `${t.id},${t.domain},${t.snippet.replace(/"/g, '""')}`);
    const csv = `tenantId,domain,snippet\n${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snippets.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          Bulk onboarding (admin)
        </Typography>
        <CsvDropzone
          label="Upload tenants CSV"
          onUploadHint="Columns: name, brand, domain, plan"
          onFile={(file) => void onFile(file)}
        />
        {error !== null && <Typography className="text-sm text-red-600">{error}</Typography>}
        {rows.length > 0 && (
          <div className="space-y-2">
            <Typography className="text-sm text-slate-600">
              {rows.length} valid row{rows.length === 1 ? '' : 's'} ready to create.
            </Typography>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Brand</th>
                    <th className="p-2">Domain</th>
                    <th className="p-2">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.domain}-${row.name}`} className="border-t border-slate-100">
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">{row.brand}</td>
                      <td className="p-2">{row.domain}</td>
                      <td className="p-2">{row.plan ?? 'starter'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={() => void onCreate()} disabled={submitting}>
              {submitting ? 'Creating…' : `Create ${rows.length} tenant${rows.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        )}
      </Card>
      {created.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <Typography as="h3" className="text-lg font-semibold text-slate-900">
              Generated snippets
            </Typography>
            <Button variant="secondary" onClick={downloadSnippets}>
              Download CSV
            </Button>
          </div>
          <CodeBlock code={created.map((t) => `# ${t.id} (${t.domain})\n${t.snippet}`).join('\n\n')} />
        </Card>
      )}
    </div>
  );
}
