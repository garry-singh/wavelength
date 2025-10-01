"use client";

import React, { useState, useEffect } from "react";

interface RoundAnnouncementProps {
  round: number;
  totalRounds: number;
  onComplete: () => void;
}

const RoundAnnouncement: React.FC<RoundAnnouncementProps> = ({
  round,
  totalRounds,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start fade in
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-complete after 3 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const getRoundText = () => {
    if (round === totalRounds) {
      return "Final Round";
    }

    // Handle special cases for 11th, 12th, 13th
    if (round % 100 >= 11 && round % 100 <= 13) {
      return `${round}th Round`;
    }

    // Handle regular ordinal suffixes
    const lastDigit = round % 10;
    let suffix = "th";

    if (lastDigit === 1) suffix = "st";
    else if (lastDigit === 2) suffix = "nd";
    else if (lastDigit === 3) suffix = "rd";

    return `${round}${suffix} Round`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div
        className={`text-center transition-all duration-1000 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        <div className="text-8xl font-bold text-white mb-4 animate-pulse">
          {getRoundText()}
        </div>
        <div className="text-2xl text-white/70">
          Round {round} of {totalRounds}
        </div>
        <div className="mt-8">
          <div className="w-32 h-1 bg-white/30 mx-auto rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundAnnouncement;
