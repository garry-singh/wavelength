import { query } from "./_generated/server";
import { v } from "convex/values";

// Get game by room code
export const getGameByRoomCode = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode))
      .first();
  },
});

// Get game by ID
export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

// Get all players in a game
export const getGamePlayers = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

// Get player by ID
export const getPlayer = query({
  args: { playerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.playerId))
      .first();
  },
});

// Get current round guesses
export const getCurrentRoundGuesses = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return [];

    return await ctx.db
      .query("guesses")
      .withIndex("by_gameId_round", (q) => 
        q.eq("gameId", args.gameId).eq("round", game.currentRound)
      )
      .collect();
  },
});

// Get current round guesses with player info
export const getCurrentRoundGuessesWithPlayers = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return [];

    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_gameId_round", (q) => 
        q.eq("gameId", args.gameId).eq("round", game.currentRound)
      )
      .collect();

    // Get player info for each guess
    const guessesWithPlayers = await Promise.all(
      guesses.map(async (guess) => {
        const player = await ctx.db
          .query("players")
          .withIndex("by_userId", (q) => q.eq("userId", guess.playerId))
          .filter((q) => q.eq(q.field("gameId"), args.gameId))
          .first();
        
        return {
          ...guess,
          player: player || null,
        };
      })
    );

    return guessesWithPlayers;
  },
});

// Get round results
export const getRoundResults = query({
  args: { gameId: v.id("games"), round: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roundResults")
      .withIndex("by_gameId_round", (q) => 
        q.eq("gameId", args.gameId).eq("round", args.round)
      )
      .first();
  },
});

// Get all round results for a game
export const getAllRoundResults = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roundResults")
      .withIndex("by_gameId_round", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

// Get recent game state updates
export const getRecentGameState = query({
  args: { 
    gameId: v.id("games"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    return await ctx.db
      .query("gameState")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(limit);
  },
});

// Get game with players (combined query)
export const getGameWithPlayers = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    return {
      game,
      players,
    };
  },
});

// Get player's current guess for the round
export const getPlayerCurrentGuess = query({
  args: { 
    gameId: v.id("games"), 
    playerId: v.string() 
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    return await ctx.db
      .query("guesses")
      .withIndex("by_gameId_round", (q) => 
        q.eq("gameId", args.gameId).eq("round", game.currentRound)
      )
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();
  },
});

// Get player scores for a game
export const getPlayerScores = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerScores")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

// Get game statistics
export const getGameStats = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    const roundResults = await ctx.db
      .query("roundResults")
      .withIndex("by_gameId_round", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Get player scores from the new scoring system
    const playerScores = await ctx.db
      .query("playerScores")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Create a map of player scores for easy access
    const scoresMap = new Map<string, number>();
    for (const score of playerScores) {
      scoresMap.set(score.playerId, score.totalScore);
    }

    return {
      game,
      players,
      roundResults,
      playerScores: Object.fromEntries(scoresMap),
      totalRounds: game.totalRounds,
      currentRound: game.currentRound,
      gamePhase: game.gamePhase,
    };
  },
});
