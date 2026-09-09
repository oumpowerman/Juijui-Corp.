import { useState, useCallback } from 'react';
import { ViewMode } from '../../types';

export type WarpStage = 'IDLE' | 'WARPING_IN' | 'WARPING_OUT';

export function useWarpPortal() {
  const [globalWarpStage, setGlobalWarpStage] = useState<WarpStage>('IDLE');
  const [warpTargetView, setWarpTargetView] = useState<ViewMode | null>(null);

  // Play a highly immersive deep interstellar sound when warp gates open inside browser using Web Audio context
  const playWarpSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Low rumble bass sound
      const oscBass = ctx.createOscillator();
      const oscTreble = ctx.createOscillator();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      oscBass.type = 'sawtooth';
      oscBass.frequency.setValueAtTime(65, now);
      oscBass.frequency.exponentialRampToValueAtTime(320, now + 1.2);

      oscTreble.type = 'sine';
      oscTreble.frequency.setValueAtTime(330, now);
      oscTreble.frequency.exponentialRampToValueAtTime(1600, now + 0.95);

      filter.type = 'lowpass';
      filter.Q.setValueAtTime(12, now);
      filter.frequency.setValueAtTime(150, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.8);

      gainNode.gain.setValueAtTime(0.04, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.45);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      oscBass.connect(filter);
      oscTreble.connect(filter);

      if (panner) {
        panner.pan.setValueAtTime(-1, now);
        panner.pan.linearRampToValueAtTime(1, now + 1.2);
        filter.connect(panner);
        panner.connect(gainNode);
      } else {
        filter.connect(gainNode);
      }

      gainNode.connect(ctx.destination);

      oscBass.start();
      oscTreble.start();
      oscBass.stop(now + 1.6);
      oscTreble.stop(now + 1.6);
    } catch (err) {
      console.warn("Warp gate audio failed:", err);
    }
  }, []);

  const triggerWarpTransition = useCallback((targetView: ViewMode, onPeakAction: () => void) => {
    playWarpSound();
    setWarpTargetView(targetView);
    setGlobalWarpStage('WARPING_IN');

    // Change page in background at peak opacity (950ms)
    setTimeout(() => {
      onPeakAction();
      setGlobalWarpStage('WARPING_OUT');
      setTimeout(() => {
        setGlobalWarpStage('IDLE');
        setWarpTargetView(null);
      }, 1100);
    }, 950);
  }, [playWarpSound]);

  return {
    globalWarpStage,
    warpTargetView,
    playWarpSound,
    triggerWarpTransition,
    setGlobalWarpStage,
    setWarpTargetView,
  };
}
