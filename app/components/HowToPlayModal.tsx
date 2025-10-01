"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="bg-slate-800/95 border-white/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-white mb-2">
              How to Play Wavelength
            </CardTitle>
            <CardDescription className="text-white/70 text-lg">
              The telepathic party game where you read minds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-white/90">
            {/* Game Overview */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">
                🎯 Game Overview
              </h3>
              <p className="text-white/80 leading-relaxed">
                Wavelength is a social guessing game where you try to read
                minds. You give a clue, and other players try to guess where it
                falls on a spectrum between two concepts.
              </p>
            </div>

            {/* Setup */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">🎮 Setup</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Players take turns being the clue giver</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>
                    Decide how many rounds to play (1-10 rounds recommended)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>All other players try to guess your clue</span>
                </li>
              </ul>
            </div>

            {/* How to Play */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">
                🎲 How to Play
              </h3>
              <div className="space-y-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">
                    1. The Clue Giver's Turn
                  </h4>
                  <ul className="space-y-1 text-white/80 text-sm">
                    <li>
                      • You see a spectrum with two concepts (e.g., "Hot" to
                      "Cold") and a target number (e.g., 12).
                    </li>
                    <li>
                      • You give a clue that aligns with your target number
                    </li>
                    <li>
                      • The clue should help the other players guess the right
                      number
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">
                    2. The Other Players' Turn
                  </h4>
                  <ul className="space-y-1 text-white/80 text-sm">
                    <li>
                      • The other players discuss where they think your clue
                      falls on the spectrum
                    </li>
                    <li>• They make their guess by selecting a position</li>
                    <li>
                      • The closer they are to the target zone, the more points
                      they score
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">3. Scoring</h4>
                  <ul className="space-y-1 text-white/80 text-sm">
                    <li>
                      •{" "}
                      <span className="text-green-400 font-semibold">
                        Bullseye (Red):
                      </span>{" "}
                      4 points - Perfect guess!
                    </li>
                    <li>
                      •{" "}
                      <span className="text-yellow-400 font-semibold">
                        1 away (Yellow):
                      </span>{" "}
                      3 points - Very close
                    </li>
                    <li>
                      •{" "}
                      <span className="text-blue-400 font-semibold">
                        2 away (Blue):
                      </span>{" "}
                      2 points - Close enough
                    </li>
                    <li>
                      •{" "}
                      <span className="text-gray-400 font-semibold">
                        More than 2 away (Gray):
                      </span>{" "}
                      0 points - Try again next round
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Strategy Tips */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">
                💡 Strategy Tips
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">
                    For Clue Givers
                  </h4>
                  <ul className="space-y-1 text-white/80 text-sm">
                    <li>• Think about what the other players know</li>
                    <li>• Use specific, memorable clues</li>
                    <li>• Consider the context of the spectrum</li>
                    <li>• Avoid overly obvious or vague clues</li>
                  </ul>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">
                    For Guessers
                  </h4>
                  <ul className="space-y-1 text-white/80 text-sm">
                    <li>• Discuss your reasoning with other players</li>
                    <li>• Consider multiple interpretations</li>
                    <li>• Think about the clue giver's perspective</li>
                    <li>• Don't overthink it - trust your instincts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Example */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">
                📝 Example Round
              </h3>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-white/80 text-sm mb-2">
                  <strong>Spectrum:</strong> "Quiet" ←→ "Loud"
                </p>
                <p className="text-white/80 text-sm mb-2">
                  <strong>Clue:</strong> "Whisper"
                </p>
                <p className="text-white/80 text-sm">
                  <strong>Target Zone:</strong> Near the "Quiet" end of the
                  spectrum. A good guess would be in the yellow or red zone
                  close to "Quiet".
                </p>
              </div>
            </div>

            {/* Winning */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">🏆 Winning</h3>
              <p className="text-white/80 leading-relaxed">
                The player with the most points after all rounds wins! In case
                of a tie, play one more round to determine the winner.
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-2"
              >
                Got it, let's play!
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HowToPlayModal;
