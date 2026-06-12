import { useEffect, useState } from 'react';
import { Text, type TextStyle } from 'react-native';

/** Eased numeric count-up (JS-driven — text content can't be worklet-animated). */
export function CountUp({
  to,
  duration = 900,
  delay = 0,
  style,
  suffix = '',
  animate = true,
}: {
  to: number;
  duration?: number;
  delay?: number;
  style?: TextStyle | TextStyle[];
  suffix?: string;
  animate?: boolean;
}) {
  const [value, setValue] = useState(animate ? 0 : to);

  useEffect(() => {
    if (!animate) {
      setValue(to);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const timer = setTimeout(() => {
      const tick = (t: number) => {
        if (start === null) start = t;
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(to * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, duration, delay, animate]);

  return (
    <Text style={style}>
      {value}
      {suffix}
    </Text>
  );
}
