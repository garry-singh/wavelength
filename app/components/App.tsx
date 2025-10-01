"use client";

import React, { useState, useEffect } from "react";
import LobbyPage from "./LobbyPage";
import GameRoom from "./GameRoom";
import { useGame } from "../hooks/useGame";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface GameState {
  gameId: Id<"games">;
  roomCode: string;
  username: string;
  isHost: boolean;
  totalRounds: number;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Convex mutations
  const createGame = useMutation(api.mutations.createGame);
  const joinGame = useMutation(api.mutations.joinGame);

  // Generate a persistent player ID
  useEffect(() => {
    let storedPlayerId = localStorage.getItem("wavelength-player-id");
    if (!storedPlayerId) {
      storedPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem("wavelength-player-id", storedPlayerId);
    }
    setPlayerId(storedPlayerId);
  }, []);

  const handleCreateRoom = async (username: string, rounds: number) => {
    if (!playerId) return;

    setIsLoading(true);
    try {
      // Generate a random room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      console.log("Creating room with:", {
        roomCode,
        hostId: playerId,
        hostUsername: username,
        totalRounds: rounds,
      });

      // Create game in Convex
      const gameId = await createGame({
        roomCode,
        hostId: playerId,
        hostUsername: username,
        totalRounds: rounds,
      });

      console.log("Room created successfully with gameId:", gameId);

      setGameState({
        gameId,
        roomCode,
        username,
        isHost: true,
        totalRounds: rounds,
      });
    } catch (error) {
      console.error("Failed to create room:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert(
        `Failed to create room: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (username: string, roomCode: string) => {
    if (!playerId) return;

    setIsLoading(true);
    try {
      console.log("Joining room with:", {
        roomCode,
        userId: playerId,
        username,
      });

      // Join game in Convex
      const gameId = await joinGame({
        roomCode,
        userId: playerId,
        username,
      });

      console.log("Joined room successfully with gameId:", gameId);

      setGameState({
        gameId,
        roomCode,
        username,
        isHost: false, // Will be updated by GameRoom component using real data
        totalRounds: 12, // Will be updated by GameRoom component using real data
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert(
        `Failed to join room: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    setGameState(null);
  };

  if (gameState) {
    return (
      <GameRoom
        gameId={gameState.gameId}
        roomCode={gameState.roomCode}
        username={gameState.username}
        isHost={gameState.isHost}
        totalRounds={gameState.totalRounds}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return (
    <LobbyPage
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      isLoading={isLoading}
    />
  );
};

export default App;
