export type LiveEvent = {
  id: string;
  tenantId: string;
  type: string;
  sku: string | null;
  customerId: string | null;
  points: number;
  origin: string | null;
  ip: string | null;
  createdAt: string;
};

type Listener = (event: LiveEvent) => void;

export type EventBus = {
  publish(tenantId: string, event: LiveEvent): void;
  subscribe(tenantId: string, listener: Listener): () => void;
};

export function createEventBus(): EventBus {
  const listeners = new Map<string, Set<Listener>>();
  return {
    publish(tenantId, event) {
      const set = listeners.get(tenantId);
      if (set === undefined) {
        return;
      }
      for (const listener of set) {
        try {
          listener(event);
        } catch (err) {
          console.error('[bus] listener error', err);
        }
      }
    },
    subscribe(tenantId, listener) {
      let set = listeners.get(tenantId);
      if (set === undefined) {
        set = new Set();
        listeners.set(tenantId, set);
      }
      set.add(listener);
      return () => {
        const current = listeners.get(tenantId);
        if (current === undefined) {
          return;
        }
        current.delete(listener);
        if (current.size === 0) {
          listeners.delete(tenantId);
        }
      };
    },
  };
}
