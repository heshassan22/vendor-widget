type IdentifyPayload = {
  jwt: string;
  customerId?: string;
};

type QueueItem = ['identify', IdentifyPayload];

type IdentityListener = (payload: IdentifyPayload) => void;

type UniWidgetWindow = Window & {
  UniWidget?: {
    q?: QueueItem[];
    identify?: (payload: IdentifyPayload) => void;
  };
};

let currentListener: IdentityListener | null = null;

export function setupIdentityQueue(listener: IdentityListener): IdentifyPayload | null {
  currentListener = listener;
  const w = window as UniWidgetWindow;
  const queued = w.UniWidget?.q ?? [];

  const applyIdentity = (payload: IdentifyPayload): void => {
    sessionStorage.setItem('uniwidget.jwt', payload.jwt);
    if (payload.customerId !== undefined) {
      sessionStorage.setItem('uniwidget.customerId', payload.customerId);
    }
    currentListener?.(payload);
  };

  let lastPayload: IdentifyPayload | null = null;
  for (const [command, payload] of queued) {
    if (command === 'identify') {
      lastPayload = payload;
    }
  }
  if (lastPayload !== null) {
    applyIdentity(lastPayload);
  }

  w.UniWidget = w.UniWidget ?? {};
  w.UniWidget.identify = applyIdentity;

  const stored = sessionStorage.getItem('uniwidget.jwt');
  if (stored !== null) {
    return {
      jwt: stored,
      customerId: sessionStorage.getItem('uniwidget.customerId') ?? undefined,
    };
  }
  return null;
}
