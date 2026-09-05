import { useEffect, useState, useRef } from 'react';

export function AnimatedNumber({ value, formatFn = (v) => v, duration = 600 }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    // If reduced motion is preferred or values are non-numeric, skip animation
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const start = prevValueRef.current != null ? Number(prevValueRef.current) : 0;
    const end = value != null ? Number(value) : 0;

    if (prefersReducedMotion || isNaN(start) || isNaN(end) || start === end) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    let startTime = null;
    let animationFrameId = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Smooth ease-out cubic curve (Framer-like feel)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
        prevValueRef.current = end;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return <>{formatFn(displayValue)}</>;
}
