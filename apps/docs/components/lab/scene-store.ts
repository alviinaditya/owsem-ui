import { useSyncExternalStore } from "react";

// The Lab's active scene, shared with the sidebar's scene list, which renders outside the Lab.
let active = "";
const listeners = new Set<() => void>();

export function setActiveScene(id: string): void {
  if (id === active) return;
  active = id;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useActiveScene(): string {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => "",
  );
}
