"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The event Chrome fires instead of showing its own install bar. It is not in
 * `lib.dom` — no browser vendor has agreed on it — so it is described here
 * rather than reached for with `any` (the project forbids one).
 */
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * How the app can be installed on the phone it is being read on:
 *
 *   • `null`   — nothing to offer: already installed, dismissed for this visit,
 *                or a browser with no way to install at all (a desktop, an
 *                in-app webview);
 *   • `prompt` — Chrome has an install prompt ready and `install()` opens it;
 *   • `manual` — iOS, which has no API. Safari installs from its own share menu,
 *                so the only thing the app can do is say where.
 */
export type InstallOffer =
  | { kind: "prompt"; install: () => Promise<void> }
  | { kind: "manual" }
  | null;

/** Already running as an installed app — both spellings, iOS has its own. */
function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

/** iOS Safari: installable, but only by hand through the share sheet. */
function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  // Chrome and Firefox on iOS wrap the same engine but cannot install anything,
  // so telling the user how to would be telling him to do the impossible.
  const safari = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return ios && safari;
}

/**
 * Whether to offer installing this app, and how (FR-2).
 *
 * The whole point of the manifests is an icon on the home screen: the admin uses
 * this while standing over a scale, and browser chrome is a smaller touch target
 * and a URL bar he can accidentally type into. But Chrome only offers its own
 * install bar after its own heuristics are satisfied, and iOS offers nothing at
 * all — so the app asks.
 *
 * **«لاحقا» is for this visit only.** Nothing is written to the device: the
 * banner is dismissed and comes back the next time the site is opened (Khaled,
 * 2026-08-22). It stops for good only when the app is really installed — which
 * `appinstalled` catches on this visit and the standalone check catches on every
 * one after.
 *
 * `app` is still carried, because the two halves are two installed apps with two
 * manifests: putting «لوحة التحكم» on the home screen says nothing about whether
 * the customer app is there, and the events have to be listened for per shell.
 *
 * The offer is deliberately not shown the instant the page paints — see the
 * component. This hook only answers *whether*.
 */
export function useInstallPrompt(app: "admin" | "customer"): {
  offer: InstallOffer;
  dismiss: () => void;
} {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [manual, setManual] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume hidden until checked

  useEffect(() => {
    if (isStandalone()) return;

    setDismissed(false);
    if (isIosSafari()) setManual(true);

    function onBeforeInstall(e: Event) {
      // Chrome shows its own bar unless this is called, and its bar is a strip
      // at the bottom of a browser these users do not read.
      e.preventDefault();
      setEvent(e as InstallEvent);
    }
    function onInstalled() {
      setEvent(null);
      setManual(false);
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [app]);

  // Just this visit. Nothing is stored, so opening the app again brings it back.
  const dismiss = useCallback(() => setDismissed(true), []);

  const install = useCallback(async () => {
    if (!event) return;
    await event.prompt();
    // Spent either way: the event cannot be used twice, and a button that opens
    // nothing on the second tap is worse than a button that has gone.
    setEvent(null);
    setDismissed(true);
  }, [event]);

  const offer: InstallOffer = dismissed
    ? null
    : event
      ? { kind: "prompt", install }
      : manual
        ? { kind: "manual" }
        : null;

  return { offer, dismiss };
}
