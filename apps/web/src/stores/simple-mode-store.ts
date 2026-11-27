/**
 * Phone "simple mode": a portrait, Korean-first editor with big buttons (components/editor/simple).
 * On by default for touch phones; the user can switch to the full editor and back, and the choice is remembered.
 */
import { useSyncExternalStore } from "react";
import { create } from "zustand";

const STORAGE_KEY = "openreel.simpleMode";

function readEnabled(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== "off"; } catch { return true; }
}

interface SimpleModeState { enabled: boolean; setEnabled: (enabled: boolean) => void }
export const useSimpleModeStore = create<SimpleModeState>((set) => ({
  enabled: readEnabled(),
  setEnabled: (enabled) => {
    try { localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off"); } catch { /* not remembered */ }
    set({ enabled });
  },
}));

// A touch phone in either orientation (the short side is phone-sized). Landscape still counts so turning the
// phone does not throw the user into the full editor; simple mode asks them to turn it back instead.
const TOUCH_PHONE_QUERY = "(hover: none) and (pointer: coarse) and (max-width: 600px), (hover: none) and (pointer: coarse) and (max-height: 600px)";
const subscribe = (change: () => void) => {
  const query = window.matchMedia(TOUCH_PHONE_QUERY);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};

export function useTouchPhone(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(TOUCH_PHONE_QUERY).matches, () => false);
}

/** True when the simple phone editor should replace the full editor. */
export function useSimpleModeActive(): boolean {
  const phone = useTouchPhone();
  const enabled = useSimpleModeStore((s) => s.enabled);
  return phone && enabled;
}
