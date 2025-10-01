"use client";

import React, { useState, useEffect } from "react";

interface GameTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  isActive: boolean;
}

const GameTimer: React.FC<GameTimerProps> = ({
  duration,
  onTimeUp,
  isActive,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, duration, onTimeUp]);

  const getTimerColor = () => {
    if (timeLeft > 20) return "text-green-400";
    if (timeLeft > 10) return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressPercentage = () => {
    return (timeLeft / duration) * 100;
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-4 right-4 bg-slate-800/90 border border-white/20 rounded-lg p-4 z-40">
      <div className="text-center">
        <div className={`text-2xl font-bold ${getTimerColor()}`}>
          {timeLeft}s
        </div>
        <div className="text-xs text-white/60 mt-1">Time Remaining</div>
        <div className="w-20 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-red-400 transition-all duration-1000"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GameTimer;
