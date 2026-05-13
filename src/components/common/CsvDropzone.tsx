import { useRef, type ChangeEvent } from 'react';
import { Input, Typography } from 'components/elements';

type CsvDropzoneProps = {
  readonly label: string;
  readonly onUploadHint: string;
  readonly onFile?: (file: File) => void;
};

export default function CsvDropzone({ label, onUploadHint, onFile }: CsvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file !== undefined) {
      onFile?.(file);
      if (inputRef.current !== null) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <Typography as="label" className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </Typography>
      <Input ref={inputRef} type="file" accept=".csv" onChange={handleChange} />
      <Typography className="mt-2 text-xs text-slate-500">{onUploadHint}</Typography>
    </div>
  );
}
