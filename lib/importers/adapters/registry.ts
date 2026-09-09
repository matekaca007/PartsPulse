/**
 * Adapter Registry
 *
 * Maps adapter_key strings to adapter factory functions.
 * To add a new source site, import its adapter class and add
 * an entry here — that's it.
 */

import type { SourceAdapter } from "../types";
import { NiceCNCAdapter } from "./nicecnc";

type AdapterFactory = () => SourceAdapter;

const registry: Map<string, AdapterFactory> = new Map([
  ["nicecnc", () => new NiceCNCAdapter()],
  // ─── Add new adapters here ───────────────────────────────
  // ["other-store", () => new OtherStoreAdapter()],
]);

/**
 * Get an adapter instance by its key.
 * Throws if the key isn't registered.
 */
export function getAdapter(adapterKey: string): SourceAdapter {
  const factory = registry.get(adapterKey);
  if (!factory) {
    const available = Array.from(registry.keys()).join(", ");
    throw new Error(
      `Unknown adapter key "${adapterKey}". Available: ${available}`
    );
  }
  return factory();
}

/**
 * List all registered adapter keys.
 */
export function listAdapterKeys(): string[] {
  return Array.from(registry.keys());
}
