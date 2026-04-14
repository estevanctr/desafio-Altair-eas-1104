"use client";

import { useEffect, useState } from "react";

export function useTypewriter(
  text: string,
  enabled: boolean,
  speed = 12,
): { displayed: string; isTyping: boolean } {
  const [count, setCount] = useState(() => (enabled ? 0 : text.length));
  const [prevText, setPrevText] = useState(text);
  const [prevEnabled, setPrevEnabled] = useState(enabled);

  if (text !== prevText || enabled !== prevEnabled) {
    setPrevText(text);
    setPrevEnabled(enabled);
    setCount(enabled ? 0 : text.length);
  }

  useEffect(() => {
    if (!enabled || !text) return;
    const interval = window.setInterval(() => {
      setCount((current) => {
        if (current >= text.length) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, speed);
    return () => window.clearInterval(interval);
  }, [text, enabled, speed]);

  return {
    displayed: text.slice(0, count),
    isTyping: enabled && count < text.length,
  };
}
