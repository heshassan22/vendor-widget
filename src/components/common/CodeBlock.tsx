type CodeBlockProps = {
  readonly code: string;
};

export default function CodeBlock({ code }: CodeBlockProps) {
  return <pre className="overflow-x-auto rounded-xl bg-slate-900 p-5 text-sm leading-relaxed text-slate-200">{code}</pre>;
}

