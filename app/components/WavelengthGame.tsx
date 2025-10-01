"use client";

import React, { useState, useRef, useEffect } from "react";
import { Slider } from "../../components/ui/slider";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

interface WavelengthGameProps {
  isDescriber?: boolean;
  targetNumber?: number;
  spectrumPair?: { left: string; right: string };
  onSubmitGuess?: (guess: number) => void;
  canSubmit?: boolean;
  hasSubmittedGuess?: boolean;
  onSliderChange?: (position: number) => void;
}

const WavelengthGame: React.FC<WavelengthGameProps> = ({
  isDescriber = false,
  targetNumber = 12,
  spectrumPair = { left: "Cold", right: "Hot" },
  onSubmitGuess,
  canSubmit = false,
  hasSubmittedGuess = false,
  onSliderChange,
}) => {
  const [sliderPosition, setSliderPosition] = useState(12); // 1-24 range
  const dialRef = useRef<HTMLDivElement>(null);

  // Calculate rotation angle (7.5 degrees per step, -90 to 90 degrees total)
  const getRotationAngle = (position: number) => {
    // Position 1 = -90°, Position 12 = 0°, Position 24 = +90°
    return (position - 1) * (180 / 23) - 90; // -90 to 90 degrees
  };

  // Handle slider change (shadcn slider returns array of values)
  const handleSliderChange = (value: number[]) => {
    if (isDescriber) return; // Describers can't move the slider
    const newValue = value[0];
    console.log("Slider changed to:", newValue);
    setSliderPosition(newValue);
    onSliderChange?.(newValue);
  };

  // Generate spectrum segments
  const generateSpectrumSegments = () => {
    const segments = [];
    const colors = [
      "#FF6B6B",
      "#FF8E53",
      "#FF6B9D",
      "#C44569",
      "#F8B500",
      "#FFD93D",
      "#6BCF7F",
      "#4D96FF",
      "#9B59B6",
      "#E74C3C",
      "#F39C12",
      "#2ECC71",
      "#3498DB",
      "#9B59B6",
      "#E67E22",
      "#1ABC9C",
      "#34495E",
      "#E91E63",
      "#FF9800",
      "#4CAF50",
      "#2196F3",
      "#9C27B0",
      "#FF5722",
      "#607D8B",
    ];

    for (let i = 0; i < 24; i++) {
      const angle = i * (180 / 23) - 90;
      segments.push(
        <div
          key={i}
          className="absolute w-1/2 h-1/2 origin-bottom"
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div
            className="w-full h-12 bg-gradient-to-r from-transparent to-current opacity-90"
            style={{
              backgroundColor: colors[i],
              clipPath: "polygon(0 100%, 100% 100%, 50% 0%)",
              filter: "drop-shadow(0 0 2px rgba(0,0,0,0.3))",
            }}
          />
        </div>
      );
    }
    return segments;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative">
      {/* Game Title */}
      <h1
        className="text-4xl font-bold text-white mb-6 tracking-wider relative z-10"
        style={{
          textShadow:
            "0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)",
          fontFamily: "monospace",
        }}
      >
        WAVELENGTH
      </h1>

      {/* Main Game Dial */}
      <div className="relative z-10">
        {/* Outer decorative ring */}
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full opacity-30 blur-sm"></div>

        {/* Background with starry effect */}
        <div
          className="absolute inset-0 bg-slate-800 rounded-full opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, white 1px, transparent 1px),
                                radial-gradient(circle at 80% 80%, white 1px, transparent 1px),
                                radial-gradient(circle at 40% 60%, white 1px, transparent 1px),
                                radial-gradient(circle at 60% 30%, white 1px, transparent 1px)`,
            backgroundSize: "50px 50px, 30px 30px, 40px 40px, 25px 25px",
          }}
        />

        {/* Main Dial Container */}
        <div
          ref={dialRef}
          className="relative w-96 h-48 bg-gradient-to-b from-amber-50 to-amber-100 rounded-t-full border-4 border-slate-700 shadow-2xl"
          style={{
            background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)",
            boxShadow:
              "inset 0 0 20px rgba(0,0,0,0.1), 0 0 30px rgba(0,0,0,0.3), 0 0 60px rgba(139, 92, 246, 0.3)",
            filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))",
          }}
        >
          {/* Spectrum Segments */}
          <div className="absolute inset-0 overflow-hidden rounded-t-full">
            {generateSpectrumSegments()}
          </div>

          {/* Red Target Pointer (for describer) */}
          {isDescriber && (
            <div
              className="absolute bottom-0 left-1/2 w-2 h-28 bg-gradient-to-t from-red-600 to-red-500 transform -translate-x-1/2 origin-bottom shadow-lg"
              style={{
                transform: `translateX(-50%) rotate(${getRotationAngle(
                  targetNumber
                )}deg)`,
                transformOrigin: "bottom center",
                boxShadow:
                  "0 0 15px rgba(220, 38, 38, 0.8), 0 0 30px rgba(220, 38, 38, 0.4)",
                filter: "drop-shadow(0 0 5px rgba(220, 38, 38, 0.6))",
              }}
            >
              <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gradient-to-br from-red-500 to-red-700 rounded-full border-3 border-white shadow-lg"></div>
            </div>
          )}

          {/* Movable Slider (for other players) */}
          {!isDescriber && (
            <div
              className="absolute bottom-0 left-1/2 w-2 h-28 bg-gradient-to-t from-blue-600 to-blue-500 transform -translate-x-1/2 origin-bottom shadow-lg transition-transform duration-100"
              style={{
                transform: `translateX(-50%) rotate(${getRotationAngle(
                  sliderPosition
                )}deg)`,
                transformOrigin: "bottom center",
                boxShadow:
                  "0 0 15px rgba(37, 99, 235, 0.8), 0 0 30px rgba(37, 99, 235, 0.4)",
                filter: "drop-shadow(0 0 5px rgba(37, 99, 235, 0.6))",
              }}
            >
              <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full border-3 border-white shadow-lg"></div>
            </div>
          )}

          {/* Center Circle */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full border-4 border-white shadow-xl"></div>
        </div>

        {/* Spectrum Labels */}
        <div className="absolute -bottom-12 left-0 right-0 flex justify-between text-white font-bold text-lg">
          <span className="bg-slate-800/50 px-3 py-1 rounded-full border border-white/20">
            {spectrumPair.left}
          </span>
          <span className="bg-slate-800/50 px-3 py-1 rounded-full border border-white/20">
            {spectrumPair.right}
          </span>
        </div>
      </div>

      {/* Slider Control (for non-describers) */}
      {!isDescriber && (
        <div className="mt-12 w-96 bg-slate-800/50 p-6 rounded-lg border border-white/20">
          <div className="text-white text-sm mb-4 text-center">
            Current position:{" "}
            <span className="font-bold text-blue-300">{sliderPosition}</span>
          </div>
          <div className="space-y-4">
            <Slider
              value={[sliderPosition]}
              onValueChange={handleSliderChange}
              min={1}
              max={24}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-white text-sm">
              <span className="text-xs opacity-75">{spectrumPair.left}</span>
              <span className="text-xs opacity-75">{spectrumPair.right}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button for Guessers */}
      {!isDescriber && onSubmitGuess && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => {
              onSubmitGuess(sliderPosition);
              toast.success("Guess submitted!", {
                description: `You guessed ${sliderPosition}`,
              });
            }}
            disabled={!canSubmit || hasSubmittedGuess}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasSubmittedGuess ? "Guess Submitted" : "Submit Guess"}
          </Button>
        </div>
      )}

      {/* Game Info */}
      <div className="mt-8 text-center text-white relative z-10">
        <div className="text-xl mb-6 font-semibold">
          {isDescriber ? (
            <span className="text-red-400 flex items-center justify-center gap-2">
              <span className="text-2xl">🎯</span>
              <span>You are the Describer</span>
            </span>
          ) : (
            <span className="text-blue-400 flex items-center justify-center gap-2">
              <span className="text-2xl">🎮</span>
              <span>You are a Guesser</span>
            </span>
          )}
        </div>
        {isDescriber && (
          <div className="text-lg opacity-90 bg-slate-800/50 px-6 py-3 rounded-lg border border-white/20 backdrop-blur-sm">
            <p className="text-red-300">
              Target:{" "}
              <span className="font-bold text-red-200">{targetNumber}</span>{" "}
              (Only you can see this)
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-sm opacity-75 max-w-md mx-auto">
          {isDescriber ? (
            <p>Give a clue to help others guess the target number!</p>
          ) : (
            <p>
              Move the slider to make your guess based on the describer's clues!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WavelengthGame;
