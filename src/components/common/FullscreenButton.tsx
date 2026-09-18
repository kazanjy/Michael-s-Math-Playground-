import { Maximize, Minimize } from 'lucide-react';
import { Button } from './Button';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

// Toggles fullscreen so the browser chrome stops shifting the page around on a
// tablet. Renders nothing when there is nothing to toggle: iPhone Safari has no
// fullscreen support at all, and an installed PWA already has no chrome.
export function FullscreenButton() {
  const { isFullscreen, isSupported, toggle } = useFullscreen();
  const { isPWA } = useDeviceDetect();

  if (!isSupported || isPWA) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      data-tip={isFullscreen ? 'Exit fullscreen' : 'Fill the screen and hide the browser bars'}
    >
      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
    </Button>
  );
}
