import { MessageSquare } from '@/lib/icons/icons';
import { cn } from '@/lib/utils';

type WidgetPreviewProps = {
  readonly primaryColor: string;
  readonly welcomeMessage: string;
  readonly buttonText: string;
  readonly launcherLabel: string;
  readonly position: 'bottom-left' | 'bottom-right';
};

export default function WidgetPreview({
  primaryColor,
  welcomeMessage,
  buttonText,
  launcherLabel,
  position,
}: WidgetPreviewProps) {
  return (
    <div className="relative h-[400px] overflow-hidden rounded-xl border border-slate-200 bg-white p-8">
      <div
        className={cn(
          'absolute bottom-6 flex flex-col gap-3',
          position === 'bottom-right' ? 'right-6 items-end' : 'left-6 items-start',
        )}
      >
        <div className="w-72 rounded-xl border border-slate-100 bg-white p-4 shadow-lg">
          <h4 className="font-semibold text-slate-900">{welcomeMessage}</h4>
          <p className="mt-1 text-xs text-slate-500">Ready to reward your shoppers.</p>
          <button className="mt-3 w-full rounded-md py-2 text-sm font-semibold text-white" style={{ backgroundColor: primaryColor }}>
            {buttonText}
          </button>
        </div>
        <button className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
          <MessageSquare size={22} />
        </button>
        <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] text-white">{launcherLabel}</span>
      </div>
    </div>
  );
}

