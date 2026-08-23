"use client";

import { useCallback, useRef } from "react";

/**
 * A short sound effect, played from a user's tap.
 *
 * Phones refuse to play audio that no one asked for, and the permission is tied
 * to the gesture itself — not to the page. That is the whole difficulty here:
 * the sound belongs *after* the order is saved, and by then the tap is over and
 * the browser has stopped counting it.
 *
 * So it happens in two moves:
 *
 * - **`prime()`** runs synchronously inside the tap handler, before any `await`.
 *   It starts and stops the clip at zero volume, which is what unlocks the
 *   element for the rest of its life. Silent, and over in the same tick.
 * - **`play()`** runs whenever the good news actually arrives — a second, a
 *   round trip later — and is allowed, because the element is already unlocked.
 *
 * Every failure is swallowed. A phone on silent, a browser that refuses anyway,
 * a file that will not decode: none of that is a reason to interrupt a customer
 * who has just successfully ordered.
 */
export function useSound(src: string) {
  const ref = useRef<HTMLAudioElement | null>(null);

  const get = useCallback(() => {
    if (!ref.current) {
      const audio = new Audio(src);
      audio.preload = "auto";
      ref.current = audio;
    }
    return ref.current;
  }, [src]);

  /** Call inside the tap handler, before anything asynchronous. */
  const prime = useCallback(() => {
    const audio = get();
    audio.volume = 0;
    // `pause()` right after `play()` rejects the play promise with an
    // AbortError, which is expected and meaningless here.
    void audio.play().catch(() => {});
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
  }, [get]);

  const play = useCallback(() => {
    const audio = get();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }, [get]);

  return { prime, play };
}
