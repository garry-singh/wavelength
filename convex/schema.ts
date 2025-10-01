import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Game rooms
  games: defineTable({
    roomCode: v.string(),
    hostId: v.string(),
    totalRounds: v.number(),
    currentRound: v.number(),
    gamePhase: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("scoring"),
      v.literal("finished")
    ),
    targetNumber: v.optional(v.number()),
    spectrumPair: v.optional(v.object({
      left: v.string(),
      right: v.string(),
    })),
    currentDescriberId: v.optional(v.string()),
    describersThisRound: v.optional(v.array(v.string())), // Track who has been describer this round
    roundStartedAt: v.optional(v.number()),
    playersReadyForNextRound: v.optional(v.array(v.string())), // Track who has clicked continue
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_roomCode", ["roomCode"])
    .index("by_hostId", ["hostId"]),

  // Players in games
  players: defineTable({
    gameId: v.id("games"),
    userId: v.string(),
    username: v.string(),
    isOnline: v.boolean(),
    isDescriber: v.boolean(),
    joinedAt: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_userId", ["userId"]),

  // Player scores
  playerScores: defineTable({
    gameId: v.id("games"),
    playerId: v.string(),
    totalScore: v.number(),
    roundScores: v.array(v.object({
      round: v.number(),
      score: v.number(),
      isDescriber: v.boolean(),
    })),
    updatedAt: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_playerId", ["playerId"])
    .index("by_gameId_playerId", ["gameId", "playerId"]),

  // Player guesses and actions
  guesses: defineTable({
    gameId: v.id("games"),
    playerId: v.string(),
    round: v.number(),
    guess: v.number(), // 1-24
    submittedAt: v.number(),
  })
    .index("by_gameId_round", ["gameId", "round"])
    .index("by_playerId", ["playerId"]),

  // Game results and scoring
  roundResults: defineTable({
    gameId: v.id("games"),
    round: v.number(),
    targetNumber: v.number(),
    guesses: v.array(v.object({
      playerId: v.string(),
      guess: v.number(),
      score: v.number(), // points earned
    })),
    createdAt: v.number(),
  })
    .index("by_gameId_round", ["gameId", "round"]),

  // Real-time game state updates
  gameState: defineTable({
    gameId: v.id("games"),
    type: v.union(
      v.literal("pointer_moved"),
      v.literal("guess_submitted"),
      v.literal("round_ended"),
      v.literal("game_started"),
      v.literal("describer_switched")
    ),
    playerId: v.string(),
    data: v.any(), // Flexible data for different event types
    timestamp: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_timestamp", ["timestamp"]),
});
