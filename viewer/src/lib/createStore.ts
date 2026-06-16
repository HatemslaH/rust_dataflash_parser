import { useSyncExternalStore } from "react";

export type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

export function createStore<T extends object>(
  createState: (set: SetState<T>, get: () => T) => T,
) {
  let state: T;
  const listeners = new Set<() => void>();

  const get = () => state;
  const set: SetState<T> = (partial) => {
    const patch = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...patch };
    for (const listener of listeners) {
      listener();
    }
  };

  state = createState(set, get);

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function useStore<U>(selector: (s: T) => U): U {
    return useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(state),
    );
  }

  return { getState: get, setState: set, subscribe, useStore };
}
