// Account system is temporarily disabled. `ready` is frozen to `false` so
// every persistence helper falls back to localStorage. Restore the mutable
// flag (and the bridge that flips it) when bringing auth back online.
export const persistenceCloud: { readonly ready: false } = Object.freeze({ ready: false });
