import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BoxProps = {
  readonly className?: string;
  readonly children: ReactNode;
};

export function Box({ className, children }: BoxProps) {
  return <div className={className}>{children}</div>;
}

type TypographyProps = {
  readonly as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'label';
  readonly className?: string;
  readonly children: ReactNode;
};

export function Typography({ as = 'p', className, children }: TypographyProps) {
  const Component = as;
  return <Component className={className}>{children}</Component>;
}

type ButtonProps = {
  readonly variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  readonly className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  } as const;

  return (
    <button
      className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50', styles[variant], className)}
      {...props}
    />
  );
}

type InputProps = {
  readonly className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500',
        className,
      )}
      {...props}
    />
  );
});

type TextareaProps = {
  readonly className?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn('w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500', className)}
      {...props}
    />
  );
}

type CardProps = {
  readonly className?: string;
  readonly children: ReactNode;
};

export function Card({ className, children }: CardProps) {
  return <div className={cn('rounded-xl border border-slate-200 bg-white p-6 shadow-sm', className)}>{children}</div>;
}

type BadgeProps = {
  readonly className?: string;
  readonly children: ReactNode;
};

export function Badge({ className, children }: BadgeProps) {
  return <span className={cn('rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700', className)}>{children}</span>;
}

