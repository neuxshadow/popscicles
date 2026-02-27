"use client";

import { useEffect, useRef, useState } from "react";

export function HeroScrollFrames() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [mounted, setMounted] = useState(false);
  const [manifest, setManifest] = useState<string[]>([]);
  const [isInView, setIsInView] = useState(false);

  // Animation & Smoothing state (Refs to avoid re-renders)
  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const lastUpdate = useRef(0);
  const currentFrameIndex = useRef(-1);
  
  // Preloading
  const preloadedImages = useRef<Record<string, HTMLImageElement>>({});
  const preloadingQueue = useRef<string[]>([]);
  const isPreloadingWindow = useRef(false);

  useEffect(() => {
    setMounted(true);

    fetch("/frames/manifest.json")
      .then((res) => res.json())
      .then((data) => {
        setManifest(data);
        if (data.length > 0) {
          // Load first frame immediately
          const firstImg = new Image();
          firstImg.src = `/frames/${data[0]}`;
          firstImg.onload = () => {
            preloadedImages.current[data[0]] = firstImg;
            // Start background preloading
            preloadingQueue.current = [...data.slice(1)];
            processPreloadQueue();
          };
        }
      });

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 }
    );
    
    const scrollWrapper = document.getElementById("hero-scroll-wrapper");
    if (scrollWrapper) observer.observe(scrollWrapper);

    return () => observer.disconnect();
  }, []);

  const processPreloadQueue = () => {
    if (preloadingQueue.current.length === 0) return;
    const fileName = preloadingQueue.current.shift()!;
    if (preloadedImages.current[fileName]) {
      processPreloadQueue();
      return;
    }
    const img = new Image();
    img.src = `/frames/${fileName}`;
    img.onload = () => {
      preloadedImages.current[fileName] = img;
      processPreloadQueue();
    };
  };

  // Prioritized window preloading
  const preloadWindow = (centerIndex: number) => {
    if (isPreloadingWindow.current) return;
    isPreloadingWindow.current = true;

    const windowSize = 8;
    const start = Math.max(0, centerIndex - windowSize);
    const end = Math.min(manifest.length - 1, centerIndex + windowSize);

    for (let i = start; i <= end; i++) {
      const fileName = manifest[i];
      if (!preloadedImages.current[fileName]) {
        const img = new Image();
        img.src = `/frames/${fileName}`;
        img.onload = () => { preloadedImages.current[fileName] = img; };
      }
    }
    
    setTimeout(() => { isPreloadingWindow.current = false; }, 100);
  };

  useEffect(() => {
    if (!mounted || manifest.length === 0 || !isInView) return;

    let frameId: number;

    const tick = (now: number) => {
      // FPS Cap (approx 60fps)
      if (now - lastUpdate.current < 16) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      lastUpdate.current = now;

      const scrollWrapper = document.getElementById("hero-scroll-wrapper");
      if (!scrollWrapper || !imgRef.current) return;

      const rect = scrollWrapper.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollDistance = rect.height - windowHeight;
      
      // Target progress based on scroll
      const rawTarget = Math.max(0, Math.min(1, -rect.top / totalScrollDistance));
      targetProgress.current = rawTarget;

      // LERP Easing: current = current + (target - current) * easeFactor
      // Lower factor = smoother but more "laggy" (0.1 is good for buttery feel)
      const easeFactor = 0.1;
      currentProgress.current += (targetProgress.current - currentProgress.current) * easeFactor;

      // Map smoothed progress to frame index
      const frameIndex = Math.floor(currentProgress.current * (manifest.length - 1));
      
      // Only update DOM if frame actually changed
      if (frameIndex !== currentFrameIndex.current) {
        currentFrameIndex.current = frameIndex;
        const fileName = manifest[frameIndex];
        const targetSrc = `/frames/${fileName}`;

        // Check if preloaded, if not, trigger priority preload for this area
        if (!preloadedImages.current[fileName]) {
          preloadWindow(frameIndex);
        }

        if (imgRef.current.src !== targetSrc) {
          imgRef.current.src = targetSrc;
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [mounted, manifest, isInView]);

  if (!mounted) return <div className="absolute inset-0 z-0 pointer-events-none opacity-0" />;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div 
        className="sticky top-0 h-screen w-full flex items-center justify-center transition-all duration-300"
        style={{ 
          opacity: 0.4 + currentProgress.current * 0.4,
          filter: `brightness(${0.8 + currentProgress.current * 0.4}) saturate(${0.9 + currentProgress.current * 0.2})` 
        }}
      >
        {manifest.length > 0 && (
          <img
            ref={imgRef}
            src={`/frames/${manifest[0]}`}
            alt=""
            className="object-cover w-full h-full"
          />
        )}
      </div>
    </div>
  );
}
