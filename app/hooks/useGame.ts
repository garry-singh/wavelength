"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";

interface UseGameProps {
  gameId: Id<"games"> | null;
  playerId: string | null;
  currentSliderPosition?: number;
}

export function useGame({ gameId, playerId, currentSliderPosition = 12 }: UseGameProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [hasSubmittedGuess, setHasSubmittedGuess] = useState(false);
  const [showRoundAnnouncement, setShowRoundAnnouncement] = useState(false);
  const [timerActive, setTimerActive] = useState(false);

  // Queries
  const game = useQuery(api.queries.getGame, gameId ? { gameId } : "skip");
  const gameWithPlayers = useQuery(api.queries.getGameWithPlayers, gameId ? { gameId } : "skip");
  const currentGuess = useQuery(
    api.queries.getPlayerCurrentGuess, 
    gameId && playerId ? { gameId, playerId } : "skip"
  );
  const gameStats = useQuery(api.queries.getGameStats, gameId ? { gameId } : "skip");
  const playerScores = useQuery(api.queries.getPlayerScores, gameId ? { gameId } : "skip");
  const currentRoundGuesses = useQuery(api.queries.getCurrentRoundGuessesWithPlayers, gameId ? { gameId } : "skip");

  // Mutations
  const createGame = useMutation(api.mutations.createGame);
  const joinGame = useMutation(api.mutations.joinGame);
  const startGame = useMutation(api.mutations.startGame);
  const submitGuess = useMutation(api.mutations.submitGuess);
  const continueToNextRound = useMutation(api.mutations.continueToNextRound);
  const markPlayerReadyForNextRound = useMutation(api.mutations.markPlayerReadyForNextRound);
  const autoSubmitGuesses = useMutation(api.mutations.autoSubmitGuesses);
  const updatePlayerStatus = useMutation(api.mutations.updatePlayerStatus);

  // Connection status
  useEffect(() => {
    setIsConnected(!!game);
  }, [game]);

  // Auto-update player status
  useEffect(() => {
    if (playerId) {
      updatePlayerStatus({ playerId, isOnline: true });
      
      // Set offline when component unmounts
      return () => {
        updatePlayerStatus({ playerId, isOnline: false });
      };
    }
  }, [playerId, updatePlayerStatus]);

  // Reset guess submission state when game phase changes to playing
  useEffect(() => {
    if (game?.gamePhase === "playing") {
      setHasSubmittedGuess(false);
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  }, [game?.gamePhase]);

  // Show round announcement when round changes
  useEffect(() => {
    if (game?.currentRound && game.gamePhase === "playing") {
      setShowRoundAnnouncement(true);
      const timer = setTimeout(() => {
        setShowRoundAnnouncement(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [game?.currentRound]);

  // Helper functions
  const isHost = game?.hostId === playerId;
  const currentPlayer = gameWithPlayers?.players.find(p => p.userId === playerId);
  const isDescriber = currentPlayer?.isDescriber || false;
  const canSubmitGuess = game?.gamePhase === "playing" && !isDescriber;
  const canStartGame = isHost && game?.gamePhase === "waiting";

  // Actions
  const handleCreateGame = async (roomCode: string, hostUsername: string, totalRounds: number) => {
    if (!playerId) throw new Error("Player ID required");
    
    return await createGame({
      roomCode,
      hostId: playerId,
      hostUsername,
      totalRounds,
    });
  };

  const handleJoinGame = async (roomCode: string, username: string) => {
    if (!playerId) throw new Error("Player ID required");
    
    return await joinGame({
      roomCode,
      userId: playerId,
      username,
    });
  };

  const handleStartGame = async () => {
    if (!gameId || !playerId) throw new Error("Game ID and Player ID required");
    
    return await startGame({
      gameId,
      hostId: playerId,
    });
  };

  const handleSubmitGuess = async (guess: number) => {
    if (!gameId || !playerId) throw new Error("Game ID and Player ID required");
    
    const result = await submitGuess({
      gameId,
      playerId,
      guess,
    });
    
    setHasSubmittedGuess(true);
    return result;
  };

  // Timer logic - auto-submit current slider position when timer expires
  useEffect(() => {
    if (timerActive && game?.gamePhase === "playing") {
      const timer = setTimeout(() => {
        if (gameId && playerId && !isDescriber) {
          // Auto-submit the current slider position
          handleSubmitGuess(currentSliderPosition);
        }
        // Also trigger the server-side auto-submit for other players
        if (gameId) {
          autoSubmitGuesses({ gameId });
        }
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [timerActive, game?.gamePhase, gameId, playerId, isDescriber, currentSliderPosition, handleSubmitGuess, autoSubmitGuesses]);

  const handleContinueToNextRound = async () => {
    if (!gameId || !playerId) throw new Error("Game ID and Player ID required");
    
    return await continueToNextRound({
      gameId,
      playerId,
    });
  };

  const handleMarkPlayerReady = async () => {
    if (!gameId || !playerId) throw new Error("Game ID and Player ID required");
    
    return await markPlayerReadyForNextRound({
      gameId,
      playerId,
    });
  };

  return {
    // State
    game,
    gameWithPlayers,
    currentGuess,
    gameStats,
    playerScores,
    currentRoundGuesses,
    isConnected,
    hasSubmittedGuess,
    showRoundAnnouncement,
    timerActive,
    
    // Player info
    currentPlayer,
    isHost,
    isDescriber,
    
    // Permissions
    canSubmitGuess,
    canStartGame,
    
    // Actions
    handleCreateGame,
    handleJoinGame,
    handleStartGame,
    handleSubmitGuess,
    handleContinueToNextRound,
    handleMarkPlayerReady,
  };
}
