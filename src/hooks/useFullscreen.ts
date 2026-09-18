import { useState, useEffect, useCallback } from 'react';

// Safari (desktop and iPadOS) still only ships the prefixed Fullscreen API,
// so every call has to check for both spellings.
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
}

function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

// Static capability check - the answer cannot change during a session.
function detectSupport(): boolean {
  const doc = document as FullscreenDocument;
  const el = document.documentElement as FullscreenElement;
  return (
    Boolean(doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled) &&
    typeof (el.requestFullscreen ?? el.webkitRequestFullscreen) === 'function'
  );
}

interface FullscreenState {
  // Whether the page is currently filling the screen.
  isFullscreen: boolean;
  // False on iPhone Safari, which has never supported fullscreen for anything
  // but <video>. Callers should hide the control rather than offer a no-op.
  isSupported: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

export function useFullscreen(): FullscreenState {
  const [isFullscreen, setIsFullscreen] = useState(() => getFullscreenElement() !== null);
  const [isSupported] = useState(detectSupport);

  useEffect(() => {
    // The user can leave fullscreen without touching our button (Esc, the iPad
    // home gesture), so mirror the browser's state rather than tracking our own.
    const sync = () => setIsFullscreen(getFullscreenElement() !== null);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const enter = useCallback(async () => {
    const el = document.documentElement as FullscreenElement;
    const request = el.requestFullscreen ?? el.webkitRequestFullscreen;
    if (!request) return;
    try {
      // Must be called from a user gesture; browsers reject it otherwise.
      await request.call(el);
    } catch {
      // Denied or unsupported - the page still works, just with chrome showing.
    }
  }, []);

  const exit = useCallback(async () => {
    const doc = document as FullscreenDocument;
    const release = doc.exitFullscreen ?? doc.webkitExitFullscreen;
    if (!release || !getFullscreenElement()) return;
    try {
      await release.call(doc);
    } catch {
      // Nothing useful to do if the browser refuses.
    }
  }, []);

  const toggle = useCallback(async () => {
    if (getFullscreenElement()) {
      await exit();
    } else {
      await enter();
    }
  }, [enter, exit]);

  return { isFullscreen, isSupported, enter, exit, toggle };
}
