"use client";

import React, { useState, useEffect } from "react";
import WavelengthGame from "./WavelengthGame";
import RevealScreen from "./RevealScreen";
import RoundAnnouncement from "./RoundAnnouncement";
import GameTimer from "./GameTimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Id } from "../../convex/_generated/dataModel";
import { useGame } from "../hooks/useGame";

interface GameRoomProps {
  gameId: Id<"games">;
  roomCode: string;
  username: string;
  isHost: boolean;
  totalRounds?: number;
  onLeaveRoom: () => void;
}

const GameRoom: React.FC<GameRoomProps> = ({
  gameId,
  roomCode,
  username,
  isHost,
  totalRounds = 12,
  onLeaveRoom,
}) => {
  // Generate a persistent player ID (same as in App component)
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [currentSliderPosition, setCurrentSliderPosition] = useState(12);

  useEffect(() => {
    let storedPlayerId = localStorage.getItem("wavelength-player-id");
    if (!storedPlayerId) {
      storedPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem("wavelength-player-id", storedPlayerId);
    }
    setPlayerId(storedPlayerId);
  }, []);

  // Use the useGame hook for real-time data
  const {
    game,
    gameWithPlayers,
    currentGuess,
    gameStats,
    playerScores,
    currentRoundGuesses,
    isConnected,
    currentPlayer,
    isHost: realIsHost,
    isDescriber,
    canSubmitGuess,
    canStartGame,
    handleStartGame,
    handleSubmitGuess,
    handleContinueToNextRound,
    handleMarkPlayerReady,
    hasSubmittedGuess,
    showRoundAnnouncement,
    timerActive,
  } = useGame({ gameId, playerId, currentSliderPosition });

  // Use real data from Convex
  const players = gameWithPlayers?.players || [];
  const currentRound = game?.currentRound || 1;
  const gamePhase = game?.gamePhase || "waiting";
  const targetNumber = game?.targetNumber || 12;

  // Helper function to get player score
  const getPlayerScore = (playerId: string) => {
    const scoreRecord = playerScores?.find(
      (score) => score.playerId === playerId
    );
    return scoreRecord?.totalScore || 0;
  };

  // Handlers are now provided by useGame hook

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Round Announcement */}
      {showRoundAnnouncement && (
        <RoundAnnouncement
          round={currentRound}
          totalRounds={game?.totalRounds || 5}
          onComplete={() => {}}
        />
      )}

      {/* Game Timer */}
      <GameTimer
        duration={30}
        onTimeUp={() => {
          // Timer will auto-submit guesses via the mutation
        }}
        isActive={timerActive && gamePhase === "playing"}
      />
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">WAVELENGTH</h1>
            <Badge variant="outline" className="text-white border-white/30">
              Room: {roomCode}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-white text-sm">
              Round {currentRound} of {game?.totalRounds || totalRounds}
            </div>
            <Button
              variant="outline"
              onClick={onLeaveRoom}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Leave Room
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Players & Game Info */}
        <div className="w-80 bg-slate-800/30 border-r border-white/20 p-6">
          <Card className="bg-slate-800/50 border-white/20 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {players.map((player) => (
                <div
                  key={player._id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.isDescriber
                      ? "bg-red-500/20 border border-red-500/30"
                      : "bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        player.isOnline ? "bg-green-400" : "bg-gray-400"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span className="text-white font-medium">
                        {player.username}
                        {player.userId === playerId && " (You)"}
                      </span>
                      <span className="text-xs text-white/60">
                        Score: {getPlayerScore(player.userId)}
                      </span>
                    </div>
                  </div>
                  {player.isDescriber && (
                    <Badge className="bg-red-500 text-white">Describer</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Game Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-white/70 text-sm">
                <div>
                  Phase:{" "}
                  <span className="text-white font-medium capitalize">
                    {gamePhase}
                  </span>
                </div>
                <div>
                  Round:{" "}
                  <span className="text-white font-medium">
                    {currentRound}/{game?.totalRounds || totalRounds}
                  </span>
                </div>
                <div>
                  Your Role:{" "}
                  <span className="text-white font-medium">
                    {isDescriber ? "Describer" : "Guesser"}
                  </span>
                </div>
                {game?.describersThisRound && (
                  <div className="text-xs text-white/60">
                    Describers this round: {game.describersThisRound.length}/
                    {players.length}
                  </div>
                )}
              </div>

              {gamePhase === "waiting" && (
                <div className="text-center text-white/70 text-sm">
                  {isHost
                    ? 'Click "Start Game" to begin the first round'
                    : "Waiting for host to start the game..."}
                  {isHost && (
                    <Button
                      onClick={handleStartGame}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                    >
                      Start Game
                    </Button>
                  )}
                </div>
              )}

              {gamePhase === "playing" && isDescriber && (
                <div className="text-center text-white/70 text-sm">
                  You are the describer. Give clues to help others guess!
                </div>
              )}

              {gamePhase === "scoring" && (
                <div className="text-center text-white/70 text-sm">
                  Calculating score...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-lg animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
          </div>

          {gamePhase === "waiting" ? (
            <div className="text-center text-white relative z-10">
              <h2 className="text-3xl font-bold mb-4">
                Waiting for Game to Start
              </h2>
              <p className="text-white/70">
                {isHost
                  ? 'Click "Start Game" to begin'
                  : "Waiting for host to start the game..."}
              </p>
            </div>
          ) : gamePhase === "scoring" ? (
            <div className="w-full max-w-6xl relative z-10">
              <RevealScreen
                targetNumber={targetNumber}
                guesses={currentRoundGuesses || []}
                onContinue={handleContinueToNextRound}
                onMarkReady={handleMarkPlayerReady}
                isDescriber={isDescriber}
                playersReady={game?.playersReadyForNextRound || []}
                totalPlayers={players.length}
                isPlayerReady={
                  game?.playersReadyForNextRound?.includes(playerId || "") ||
                  false
                }
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl relative z-10">
              <WavelengthGame
                isDescriber={isDescriber}
                targetNumber={targetNumber}
                onSubmitGuess={handleSubmitGuess}
                canSubmit={canSubmitGuess}
                hasSubmittedGuess={hasSubmittedGuess}
                onSliderChange={setCurrentSliderPosition}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
