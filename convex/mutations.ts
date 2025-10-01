import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new game room
export const createGame = mutation({
  args: {
    roomCode: v.string(),
    hostId: v.string(),
    hostUsername: v.string(),
    totalRounds: v.number(),
  },
  handler: async (ctx, args) => {
    const gameId = await ctx.db.insert("games", {
      roomCode: args.roomCode,
      hostId: args.hostId,
      totalRounds: args.totalRounds,
      currentRound: 1,
      gamePhase: "waiting",
      describersThisRound: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add the host as the first player
    await ctx.db.insert("players", {
      gameId,
      userId: args.hostId,
      username: args.hostUsername,
      isOnline: true,
      isDescriber: true, // Host starts as describer
      joinedAt: Date.now(),
    });

    return gameId;
  },
});

// Join an existing game
export const joinGame = mutation({
  args: {
    roomCode: v.string(),
    userId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the game by room code
    const game = await ctx.db
      .query("games")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.gamePhase === "finished") {
      throw new Error("Game has already finished");
    }

    // Check if player already exists
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("gameId"), game._id))
      .first();

    if (existingPlayer) {
      // Update existing player to online
      await ctx.db.patch(existingPlayer._id, {
        isOnline: true,
        username: args.username,
      });
      return game._id;
    }

    // Add new player
    await ctx.db.insert("players", {
      gameId: game._id,
      userId: args.userId,
      username: args.username,
      isOnline: true,
      isDescriber: false,
      joinedAt: Date.now(),
    });

    return game._id;
  },
});

// Start the game
export const startGame = mutation({
  args: {
    gameId: v.id("games"),
    hostId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.hostId !== args.hostId) {
      throw new Error("Only the host can start the game");
    }

    if (game.gamePhase !== "waiting") {
      throw new Error("Game has already started");
    }

    // Generate random target number (1-24)
    const targetNumber = Math.floor(Math.random() * 24) + 1;

    await ctx.db.patch(args.gameId, {
      gamePhase: "playing",
      targetNumber,
      currentDescriberId: args.hostId,
      describersThisRound: [args.hostId], // Start with host as first describer
      roundStartedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log game start event
    await ctx.db.insert("gameState", {
      gameId: args.gameId,
      type: "game_started",
      playerId: args.hostId,
      data: { targetNumber },
      timestamp: Date.now(),
    });
  },
});

// Submit a guess
export const submitGuess = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.string(),
    guess: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.gamePhase !== "playing") {
      throw new Error("Game is not in playing phase");
    }

    // Check if player is the describer
    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.playerId))
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    if (!player) {
      throw new Error("Player not found");
    }

    if (player.isDescriber) {
      throw new Error("Describers cannot submit guesses");
    }

    // Check if guess already exists for this round
    const existingGuess = await ctx.db
      .query("guesses")
      .withIndex("by_gameId_round", (q) => 
        q.eq("gameId", args.gameId).eq("round", game.currentRound)
      )
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    if (existingGuess) {
      // Update existing guess
      await ctx.db.patch(existingGuess._id, {
        guess: args.guess,
        submittedAt: Date.now(),
      });
    } else {
      // Create new guess
      await ctx.db.insert("guesses", {
        gameId: args.gameId,
        playerId: args.playerId,
        round: game.currentRound,
        guess: args.guess,
        submittedAt: Date.now(),
      });
    }

    // Check if all non-describer players have submitted guesses
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q: any) => q.eq("gameId", args.gameId))
      .collect();

    const nonDescriberPlayers = allPlayers.filter(p => !p.isDescriber);
    const submittedGuesses = await ctx.db
      .query("guesses")
      .withIndex("by_gameId_round", (q: any) => 
        q.eq("gameId", args.gameId).eq("round", game.currentRound)
      )
      .collect();

    const submittedPlayerIds = new Set(submittedGuesses.map(g => g.playerId));
    const allNonDescribersSubmitted = nonDescriberPlayers.every(p => 
      submittedPlayerIds.has(p.userId)
    );

    // If all non-describer players have submitted, move to reveal phase
    if (allNonDescribersSubmitted) {
      await ctx.db.patch(args.gameId, {
        gamePhase: "scoring",
        updatedAt: Date.now(),
      });

      // Log automatic reveal
      await ctx.db.insert("gameState", {
        gameId: args.gameId,
        type: "round_ended",
        playerId: args.playerId,
        data: { 
          round: game.currentRound, 
          targetNumber: game.targetNumber,
          autoReveal: true,
          allPlayersSubmitted: true
        },
        timestamp: Date.now(),
      });
    }

    // Log guess submission
    await ctx.db.insert("gameState", {
      gameId: args.gameId,
      type: "guess_submitted",
      playerId: args.playerId,
      data: { 
        guess: args.guess, 
        round: game.currentRound,
        allPlayersSubmitted: allNonDescribersSubmitted
      },
      timestamp: Date.now(),
    });
  },
});

// Switch to next describer
export const switchDescriber = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.gamePhase !== "playing") {
      throw new Error("Game is not in playing phase");
    }

    // Check if player is the current describer
    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.playerId))
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    if (!player || !player.isDescriber) {
      throw new Error("Only the current describer can switch");
    }

    // Get all players in the game
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Find next player who hasn't been describer this round
    const describersThisRound = game.describersThisRound || [];
    const availablePlayers = allPlayers.filter(
      p => !describersThisRound.includes(p.userId)
    );

    if (availablePlayers.length === 0) {
      // All players have been describer, end the round
      // Call endRound mutation directly
      const game = await ctx.db.get(args.gameId);
      if (!game) return;
      
      // Get all guesses for this round
      const guesses = await ctx.db
        .query("guesses")
        .withIndex("by_gameId_round", (q) => 
          q.eq("gameId", args.gameId).eq("round", game.currentRound)
        )
        .collect();

      // Calculate scores
      const scoredGuesses = guesses.map(guess => ({
        playerId: guess.playerId,
        guess: guess.guess,
        score: calculateScore(guess.guess, game.targetNumber!),
      }));

      // Save round results
      await ctx.db.insert("roundResults", {
        gameId: args.gameId,
        round: game.currentRound,
        targetNumber: game.targetNumber!,
        guesses: scoredGuesses,
        createdAt: Date.now(),
      });

      // Update player scores
      await updatePlayerScores(
        ctx,
        args.gameId,
        game.currentRound,
        scoredGuesses,
        describersThisRound
      );

      // Move to next round or end game
      const nextRound = game.currentRound + 1;
      const isGameFinished = nextRound > game.totalRounds;

      // Get all players for next round
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
        .collect();

      // Get first describer for the new round
      const nextDescriberId = isGameFinished ? undefined : getFirstDescriberForRound(allPlayers, nextRound);

      await ctx.db.patch(args.gameId, {
        gamePhase: isGameFinished ? "finished" : "waiting",
        currentRound: isGameFinished ? game.currentRound : nextRound,
        targetNumber: isGameFinished ? undefined : Math.floor(Math.random() * 24) + 1,
        currentDescriberId: nextDescriberId,
        describersThisRound: isGameFinished ? [] : [nextDescriberId!],
        roundStartedAt: isGameFinished ? undefined : Date.now(),
        updatedAt: Date.now(),
      });

      // Reset all players' describer status for next round
      if (!isGameFinished) {
        const allPlayers = await ctx.db
          .query("players")
          .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
          .collect();

        for (const player of allPlayers) {
          await ctx.db.patch(player._id, {
            isDescriber: player.userId === nextDescriberId
          });
        }
      }

      // Log round end
      await ctx.db.insert("gameState", {
        gameId: args.gameId,
        type: "round_ended",
        playerId: args.playerId,
        data: { 
          round: game.currentRound, 
          targetNumber: game.targetNumber,
          scores: scoredGuesses,
          isGameFinished 
        },
        timestamp: Date.now(),
      });
      
      return;
    }

    // Select next describer (simple rotation)
    const nextDescriber = availablePlayers[0];

    // Update current describer to not be describer
    await ctx.db.patch(player._id, { isDescriber: false });

    // Update next describer to be describer
    const nextPlayer = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", nextDescriber.userId))
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    if (nextPlayer) {
      await ctx.db.patch(nextPlayer._id, { isDescriber: true });
    }

    // Generate new target number
    const newTargetNumber = Math.floor(Math.random() * 24) + 1;

    // Update game state
    await ctx.db.patch(args.gameId, {
      currentDescriberId: nextDescriber.userId,
      describersThisRound: [...describersThisRound, nextDescriber.userId],
      targetNumber: newTargetNumber,
      updatedAt: Date.now(),
    });

    // Log describer switch
    await ctx.db.insert("gameState", {
      gameId: args.gameId,
      type: "describer_switched",
      playerId: args.playerId,
      data: { 
        newDescriberId: nextDescriber.userId,
        newTargetNumber,
        describersThisRound: [...describersThisRound, nextDescriber.userId]
      },
      timestamp: Date.now(),
    });
  },
});

// End the current round
export const endRound = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.gamePhase !== "playing") {
      throw new Error("Game is not in playing phase");
    }

    // Check if player is the describer
    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.playerId))
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    if (!player || !player.isDescriber) {
      throw new Error("Only the describer can end the round");
    }

    // Get all guesses for this round
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_gameId_round", (q) => 
        q.eq("gameId", args.gameId).eq("round", game.currentRound)
      )
      .collect();

    // Calculate scores (simple scoring for now)
    const scoredGuesses = guesses.map(guess => ({
      playerId: guess.playerId,
      guess: guess.guess,
      score: calculateScore(guess.guess, game.targetNumber!),
    }));

    // Save round results
    await ctx.db.insert("roundResults", {
      gameId: args.gameId,
      round: game.currentRound,
      targetNumber: game.targetNumber!,
      guesses: scoredGuesses,
      createdAt: Date.now(),
    });

    // Update player scores
    await updatePlayerScores(
      ctx,
      args.gameId,
      game.currentRound,
      scoredGuesses,
      game.describersThisRound || []
    );

    // Move to next round or end game
    const nextRound = game.currentRound + 1;
    const isGameFinished = nextRound > game.totalRounds;

    // Get all players for next round
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Get first describer for the new round
    const nextDescriberId = isGameFinished ? undefined : getFirstDescriberForRound(allPlayers, nextRound);

    await ctx.db.patch(args.gameId, {
      gamePhase: isGameFinished ? "finished" : "waiting",
      currentRound: isGameFinished ? game.currentRound : nextRound,
      targetNumber: isGameFinished ? undefined : Math.floor(Math.random() * 24) + 1,
      currentDescriberId: nextDescriberId,
      describersThisRound: isGameFinished ? [] : [nextDescriberId!],
      roundStartedAt: isGameFinished ? undefined : Date.now(),
      updatedAt: Date.now(),
    });

    // Reset all players' describer status for next round
    if (!isGameFinished) {
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
        .collect();

      for (const player of allPlayers) {
        await ctx.db.patch(player._id, {
          isDescriber: player.userId === nextDescriberId
        });
      }
    }

    // Log round end
    await ctx.db.insert("gameState", {
      gameId: args.gameId,
      type: "round_ended",
      playerId: args.playerId,
      data: { 
        round: game.currentRound, 
        targetNumber: game.targetNumber,
        scores: scoredGuesses,
        isGameFinished 
      },
      timestamp: Date.now(),
    });
  },
});

// Continue to next round from reveal screen
export const continueToNextRound = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.gamePhase !== "scoring") {
      throw new Error("Game is not in scoring phase");
    }

    // Check if player is the describer
    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.playerId))
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    if (!player || !player.isDescriber) {
      throw new Error("Only the describer can continue to next round");
    }

    // Get all guesses for this round
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_gameId_round", (q) => 
        q.eq("gameId", args.gameId).eq("round", game.currentRound)
      )
      .collect();

    // Calculate scores
    const scoredGuesses = guesses.map(guess => ({
      playerId: guess.playerId,
      guess: guess.guess,
      score: calculateScore(guess.guess, game.targetNumber!),
    }));

    // Save round results
    await ctx.db.insert("roundResults", {
      gameId: args.gameId,
      round: game.currentRound,
      targetNumber: game.targetNumber!,
      guesses: scoredGuesses,
      createdAt: Date.now(),
    });

    // Update player scores
    await updatePlayerScores(
      ctx,
      args.gameId,
      game.currentRound,
      scoredGuesses,
      game.describersThisRound || []
    );

    // Move to next round or end game
    const nextRound = game.currentRound + 1;
    const isGameFinished = nextRound > game.totalRounds;

    // Get all players for next round
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Get first describer for the new round
    const nextDescriberId = isGameFinished ? undefined : getFirstDescriberForRound(allPlayers, nextRound);

    await ctx.db.patch(args.gameId, {
      gamePhase: isGameFinished ? "finished" : "waiting",
      currentRound: isGameFinished ? game.currentRound : nextRound,
      targetNumber: isGameFinished ? undefined : Math.floor(Math.random() * 24) + 1,
      currentDescriberId: nextDescriberId,
      describersThisRound: isGameFinished ? [] : [nextDescriberId!],
      roundStartedAt: isGameFinished ? undefined : Date.now(),
      updatedAt: Date.now(),
    });

    // Reset all players' describer status for next round
    if (!isGameFinished) {
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
        .collect();

      for (const player of allPlayers) {
        await ctx.db.patch(player._id, {
          isDescriber: player.userId === nextDescriberId
        });
      }
    }

    // Log round end
    await ctx.db.insert("gameState", {
      gameId: args.gameId,
      type: "round_ended",
      playerId: args.playerId,
      data: { 
        round: game.currentRound, 
        targetNumber: game.targetNumber,
        scores: scoredGuesses,
        isGameFinished 
      },
      timestamp: Date.now(),
    });
  },
});

// Mark player as ready for next round
export const markPlayerReadyForNextRound = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.gamePhase !== "scoring") {
      throw new Error("Game is not in scoring phase");
    }

    // Check if player is in the game
    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.playerId))
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    if (!player) {
      throw new Error("Player not found in game");
    }

    // Add player to ready list if not already there
    const currentReady = game.playersReadyForNextRound || [];
    if (!currentReady.includes(args.playerId)) {
      const updatedReady = [...currentReady, args.playerId];
      
      // Get all players in the game
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
        .collect();

      // Check if all players are ready
      const allPlayersReady = allPlayers.every(p => updatedReady.includes(p.userId));

      await ctx.db.patch(args.gameId, {
        playersReadyForNextRound: updatedReady,
        updatedAt: Date.now(),
      });

      // If all players are ready, automatically start the next round
      if (allPlayersReady) {
        // Get all guesses for this round
        const guesses = await ctx.db
          .query("guesses")
          .withIndex("by_gameId_round", (q) => 
            q.eq("gameId", args.gameId).eq("round", game.currentRound)
          )
          .collect();

        // Calculate scores
        const scoredGuesses = guesses.map(guess => ({
          playerId: guess.playerId,
          guess: guess.guess,
          score: calculateScore(guess.guess, game.targetNumber!),
        }));

        // Save round results
        await ctx.db.insert("roundResults", {
          gameId: args.gameId,
          round: game.currentRound,
          targetNumber: game.targetNumber!,
          guesses: scoredGuesses,
          createdAt: Date.now(),
        });

        // Update player scores
        await updatePlayerScores(
          ctx,
          args.gameId,
          game.currentRound,
          scoredGuesses,
          game.describersThisRound || []
        );

        // Check if all players have been describer this round
        const describersThisRound = game.describersThisRound || [];
        const allPlayersBeenDescriber = allPlayers.every(p => describersThisRound.includes(p.userId));

        if (allPlayersBeenDescriber) {
          // All players have been describer, end the round
          const nextRound = game.currentRound + 1;
          const isGameFinished = nextRound > game.totalRounds;

          // Get first describer for the new round
          const nextDescriberId = isGameFinished ? undefined : getFirstDescriberForRound(allPlayers, nextRound);

          await ctx.db.patch(args.gameId, {
            gamePhase: isGameFinished ? "finished" : "playing", // Auto-start next round
            currentRound: isGameFinished ? game.currentRound : nextRound,
            targetNumber: isGameFinished ? undefined : Math.floor(Math.random() * 24) + 1,
            currentDescriberId: nextDescriberId,
            describersThisRound: isGameFinished ? [] : [nextDescriberId!],
            playersReadyForNextRound: isGameFinished ? [] : [],
            roundStartedAt: isGameFinished ? undefined : Date.now(),
            updatedAt: Date.now(),
          });

          // Reset all players' describer status for next round
          if (!isGameFinished) {
            for (const player of allPlayers) {
              await ctx.db.patch(player._id, {
                isDescriber: player.userId === nextDescriberId
              });
            }
          }

          // Log round end
          await ctx.db.insert("gameState", {
            gameId: args.gameId,
            type: "round_ended",
            playerId: args.playerId,
            data: { 
              round: game.currentRound, 
              targetNumber: game.targetNumber,
              scores: scoredGuesses,
              isGameFinished 
            },
            timestamp: Date.now(),
          });
        } else {
          // Not all players have been describer, cycle to next describer
          const availablePlayers = allPlayers.filter(p => !describersThisRound.includes(p.userId));
          const nextDescriber = availablePlayers[0];

          if (nextDescriber) {
            // Update current describer to not be describer
            const currentDescriber = allPlayers.find(p => p.isDescriber);
            if (currentDescriber) {
              await ctx.db.patch(currentDescriber._id, { isDescriber: false });
            }

            // Update next describer to be describer
            await ctx.db.patch(nextDescriber._id, { isDescriber: true });

            // Clear all guesses for the new describer round
            const existingGuesses = await ctx.db
              .query("guesses")
              .withIndex("by_gameId_round", (q) => 
                q.eq("gameId", args.gameId).eq("round", game.currentRound)
              )
              .collect();

            for (const guess of existingGuesses) {
              await ctx.db.delete(guess._id);
            }

            // Generate new target number
            const newTargetNumber = Math.floor(Math.random() * 24) + 1;

            // Update game state
            await ctx.db.patch(args.gameId, {
              gamePhase: "playing", // Return to playing phase for next describer
              currentDescriberId: nextDescriber.userId,
              describersThisRound: [...describersThisRound, nextDescriber.userId],
              targetNumber: newTargetNumber,
              playersReadyForNextRound: [], // Reset ready list
              roundStartedAt: Date.now(), // Reset round timer
              updatedAt: Date.now(),
            });

            // Log describer switch
            await ctx.db.insert("gameState", {
              gameId: args.gameId,
              type: "describer_switched",
              playerId: args.playerId,
              data: { 
                newDescriberId: nextDescriber.userId,
                newTargetNumber,
                describersThisRound: [...describersThisRound, nextDescriber.userId]
              },
              timestamp: Date.now(),
            });
          }
        }
      }
    }
  },
});

// Auto-submit guesses when timer runs out
export const autoSubmitGuesses = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.gamePhase !== "playing") {
      return; // Game not in playing phase
    }

    // Get all players in the game
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Get all guesses for this round
    const existingGuesses = await ctx.db
      .query("guesses")
      .withIndex("by_gameId_round", (q) => 
        q.eq("gameId", args.gameId).eq("round", game.currentRound)
      )
      .collect();

    const submittedPlayerIds = new Set(existingGuesses.map(g => g.playerId));

    // Auto-submit default guess (12) for players who haven't submitted
    for (const player of allPlayers) {
      if (!player.isDescriber && !submittedPlayerIds.has(player.userId)) {
        await ctx.db.insert("guesses", {
          gameId: args.gameId,
          playerId: player.userId,
          round: game.currentRound,
          guess: 12, // Default middle guess
          submittedAt: Date.now(),
        });
      }
    }

    // Check if all non-describer players have submitted guesses
    const nonDescriberPlayers = allPlayers.filter(p => !p.isDescriber);
    const allNonDescribersSubmitted = nonDescriberPlayers.every(p => 
      submittedPlayerIds.has(p.userId)
    );

    // If all non-describer players have submitted, move to reveal phase
    if (allNonDescribersSubmitted) {
      await ctx.db.patch(args.gameId, {
        gamePhase: "scoring",
        updatedAt: Date.now(),
      });

      // Log automatic reveal
      await ctx.db.insert("gameState", {
        gameId: args.gameId,
        type: "round_ended",
        playerId: "system",
        data: { 
          round: game.currentRound, 
          targetNumber: game.targetNumber,
          autoReveal: true,
          allPlayersSubmitted: true,
          timerExpired: true
        },
        timestamp: Date.now(),
      });
    }
  },
});

// Update player online status
export const updatePlayerStatus = mutation({
  args: {
    playerId: v.string(),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.playerId))
      .first();

    if (player) {
      await ctx.db.patch(player._id, {
        isOnline: args.isOnline,
      });
    }
  },
});

// Helper function to calculate score
function calculateScore(guess: number, target: number): number {
  const difference = Math.abs(guess - target);
  
  if (difference === 0) return 4; // Perfect hit
  if (difference <= 1) return 3;  // Close hit
  if (difference <= 2) return 2;  // Near miss
  if (difference <= 3) return 1;  // Miss
  return 0; // Far miss
}

// Helper function to get first describer for a new round
function getFirstDescriberForRound(allPlayers: any[], round: number): string {
  // Each round starts with the first player, then cycles through all players
  // Round 1: Player 1, Round 2: Player 1, etc.
  // Within each round, all players get a turn as describer
  return allPlayers[0].userId;
}

// Update player scores after a round
async function updatePlayerScores(
  ctx: { db: any },
  gameId: any,
  round: number,
  scoredGuesses: Array<{playerId: string, guess: number, score: number}>,
  describersThisRound: string[]
) {
  // Get all players in the game
  const allPlayers = await ctx.db
    .query("players")
    .withIndex("by_gameId", (q: any) => q.eq("gameId", gameId))
    .collect();

  for (const player of allPlayers) {
    // Find existing score record
    const existingScore = await ctx.db
      .query("playerScores")
      .withIndex("by_gameId_playerId", (q: any) => 
        q.eq("gameId", gameId).eq("playerId", player.userId)
      )
      .first();

    // Calculate score for this round
    const guess = scoredGuesses.find(g => g.playerId === player.userId);
    const roundScore = guess ? guess.score : 0;
    const isDescriber = describersThisRound.includes(player.userId);
    
    // Add describer bonus (1 point for being describer)
    const finalRoundScore = roundScore + (isDescriber ? 1 : 0);

    const newRoundScore = {
      round,
      score: finalRoundScore,
      isDescriber,
    };

    if (existingScore) {
      // Update existing score
      const updatedRoundScores = [...existingScore.roundScores, newRoundScore];
      const newTotalScore = updatedRoundScores.reduce((sum, rs) => sum + rs.score, 0);
      
      await ctx.db.patch(existingScore._id, {
        totalScore: newTotalScore,
        roundScores: updatedRoundScores,
        updatedAt: Date.now(),
      });
    } else {
      // Create new score record
      await ctx.db.insert("playerScores", {
        gameId,
        playerId: player.userId,
        totalScore: finalRoundScore,
        roundScores: [newRoundScore],
        updatedAt: Date.now(),
      });
    }
  }
}
