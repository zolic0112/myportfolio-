"use client";

import { useEffect, useState } from "react";
import type { GameProps } from "../registry";

const DURATION = 10;

function randomSpot() {
  return { x: 10 + Math.random() * 80, y: 15 + Math.random() * 70 };
}

export default function ClickRush({ onExit }: GameProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [spot, setSpot] = useState(randomSpot);
  const done = timeLeft <= 0;

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, done]);

  function restart() {
    setScore(0);
    setTimeLeft(DURATION);
    setSpot(randomSpot());
  }

  return (
    <div className="relative h-full w-full select-none">
      <div className="flex justify-between p-4 text-sm font-medium">
        <span>分數 {score}</span>
        <span>剩餘 {Math.max(timeLeft, 0)} 秒</span>
      </div>
      {done ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <p className="text-2xl font-semibold">得分:{score}</p>
          <div className="flex gap-3">
            <button onClick={restart} className="rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--bg)]">
              再玩一次
            </button>
            <button onClick={onExit} className="rounded-full border border-[var(--border)] px-5 py-2">
              離開
            </button>
          </div>
        </div>
      ) : (
        <button
          aria-label="目標"
          onClick={() => {
            setScore((s) => s + 1);
            setSpot(randomSpot());
          }}
          className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] transition-all duration-150 active:scale-90"
          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
        />
      )}
    </div>
  );
}
