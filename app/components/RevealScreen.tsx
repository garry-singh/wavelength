"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Guess {
  _id: string;
  playerId: string;
  guess: number;
  submittedAt: number;
  player: {
    username: string;
    userId: string;
  } | null;
}

interface RevealScreenProps {
  targetNumber: number;
  guesses: Guess[];
  onContinue: () => void;
  onMarkReady: () => void;
  isDescriber?: boolean;
  playersReady?: string[];
  totalPlayers?: number;
  isPlayerReady?: boolean;
}

const RevealScreen: React.FC<RevealScreenProps> = ({
  targetNumber,
  guesses,
  onContinue,
  onMarkReady,
  isDescriber = false,
  playersReady = [],
  totalPlayers = 0,
  isPlayerReady = false,
}) => {
  // Calculate scores for each guess
  const calculateScore = (guess: number, target: number): number => {
    const difference = Math.abs(guess - target);

    if (difference === 0) return 4; // Perfect hit
    if (difference <= 1) return 3; // Close hit
    if (difference <= 2) return 2; // Near miss
    if (difference <= 3) return 1; // Miss
    return 0; // Far miss
  };

  const getScoreColor = (score: number) => {
    if (score === 4) return "bg-green-500";
    if (score === 3) return "bg-green-400";
    if (score === 2) return "bg-yellow-400";
    if (score === 1) return "bg-orange-400";
    return "bg-red-400";
  };

  const getScoreText = (score: number) => {
    if (score === 4) return "Perfect!";
    if (score === 3) return "Close!";
    if (score === 2) return "Near miss";
    if (score === 1) return "Miss";
    return "Far miss";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4">Round Results</h2>
        <div className="text-2xl text-white/70 mb-2">
          Target Number:{" "}
          <span className="text-yellow-400 font-bold">{targetNumber}</span>
        </div>
        {isDescriber && (
          <p className="text-white/60 text-sm">
            You were the describer this round
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {guesses.map((guess) => {
          const score = calculateScore(guess.guess, targetNumber);
          return (
            <Card key={guess._id} className="bg-slate-800/50 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{guess.player?.username || "Unknown Player"}</span>
                  <Badge className={`${getScoreColor(score)} text-white`}>
                    {score} pts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Guess:</span>
                    <span className="text-white font-bold text-xl">
                      {guess.guess}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Distance:</span>
                    <span className="text-white">
                      {Math.abs(guess.guess - targetNumber)} away
                    </span>
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-lg font-semibold ${getScoreColor(score)} text-white px-3 py-1 rounded-full`}
                    >
                      {getScoreText(score)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        {isPlayerReady ? (
          <div className="text-white/70 text-lg">
            Waiting for other players to continue...
            <div className="text-sm mt-2">
              {playersReady.length}/{totalPlayers} players ready
            </div>
          </div>
        ) : (
          <Button
            onClick={() => {
              onMarkReady();
              toast.success("Ready for next round!", {
                description: "Waiting for other players...",
              });
            }}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-8 py-3 text-lg"
          >
            Continue to Next Round
          </Button>
        )}
      </div>
    </div>
  );
};

export default RevealScreen;
