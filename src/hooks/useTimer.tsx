"use client";
import { useEffect, useRef, useState } from "react";

export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // formata para hh:mm:ss
  function formatTime(totalSeconds: number, showHours: boolean = true) : string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (!showHours) return [m, s].map((v) => String(v).padStart(2, "0")).join(":");

    return [h, m, s]
      .map((v) => String(v).padStart(2, "0"))
      .join(":");
  }

  function start() {
    if (intervalRef.current) return; // evita múltiplos intervalos
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  }

  function pause() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function reset() {
    pause();
    setSeconds(0);
  }

  useEffect(() => {
    return () => pause(); // limpa ao desmontar
  }, []);

  return {
    seconds,
    time: (showHours = true) => formatTime(seconds, showHours),
    start,
    pause,
    reset,
  };
}