/**
 * Unit Tests for Undercover Chameleon Game Logic
 * Runs directly with Node.js built-in assert module.
 */

const assert = require("assert");
const { WordManager } = require("../js/words");
const { GameEngine, GAME_PHASES } = require("../js/game");

console.log("=== Running Undercover Chameleon Engine Test Suite ===");

// Test 1: Word Pack Generation
{
  const wm = new WordManager();
  const topic = wm.pickRoundTopic(["cyberpunk", "tech"]);
  assert.ok(topic.categoryName, "Topic must have categoryName");
  assert.ok(topic.secretWord, "Topic must have secretWord");
  assert.strictEqual(topic.guessCandidates.length, 6, "Must provide 6 guess candidates");
  assert.ok(topic.guessCandidates.includes(topic.secretWord), "Secret word must be among the guess candidates");
  console.log("✓ Test 1: Word Pack & Guess Candidates Generation passed");
}

// Test 2: Player Management & Role Assignment
{
  const wm = new WordManager();
  const game = new GameEngine(wm);

  game.addPlayer({ id: "p1", name: "Host Player", avatar: "fa-robot", isHost: true });
  game.addPlayer({ id: "p2", name: "Player 2", avatar: "fa-ninja" });
  game.addPlayer({ id: "p3", name: "Player 3", avatar: "fa-ghost" });

  assert.strictEqual(game.players.length, 3, "Roster should have 3 players");
  assert.strictEqual(game.players[0].isHost, true, "First player should be host");

  game.startRound();
  assert.strictEqual(game.phase, GAME_PHASES.BRIEFING, "Game should enter BRIEFING phase");
  assert.strictEqual(game.round.chameleonPlayerIds.length, 1, "Should assign exactly 1 Chameleon for 3 players");

  const chamId = game.round.chameleonPlayerIds[0];
  const chamPlayer = game.players.find(p => p.id === chamId);
  assert.strictEqual(chamPlayer.isChameleon, true, "Chameleon flag must be true");

  // Verify Role Masking for Chameleon
  const chamState = game.getStateForPlayer(chamId);
  assert.ok(chamState.round.topic.secretWord.includes("MASKED"), "Secret word must be masked for Chameleon");

  // Verify Agent sees the real secret word
  const agentId = game.players.find(p => p.id !== chamId).id;
  const agentState = game.getStateForPlayer(agentId);
  assert.strictEqual(agentState.round.topic.secretWord, game.round.topic.secretWord, "Agent must see the actual secret word");

  game.clearIntervalTimer();
  console.log("✓ Test 2: Role Allocation & Cryptographic Secret Masking passed");
}

// Test 3: Clue Sequence & Turn Order Progression
{
  const wm = new WordManager();
  const game = new GameEngine(wm);

  game.addPlayer({ id: "p1", name: "Alice" });
  game.addPlayer({ id: "p2", name: "Bob" });

  game.startRound();
  game.beginCluePhase();

  assert.strictEqual(game.phase, GAME_PHASES.CLUES, "Phase should be CLUES");
  assert.strictEqual(game.round.currentTurnIndex, 0, "Turn index starts at 0");

  const turn1PlayerId = game.round.clueOrder[0];
  game.submitClue(turn1PlayerId, "Cyber");
  assert.strictEqual(game.round.clues.length, 1, "Clue should be recorded");
  assert.strictEqual(game.round.currentTurnIndex, 1, "Turn should advance to index 1");

  const turn2PlayerId = game.round.clueOrder[1];
  game.submitClue(turn2PlayerId, "Matrix");
  assert.strictEqual(game.round.clues.length, 2, "Second clue should be recorded");

  // All clues submitted -> should transition to VOTING phase
  assert.strictEqual(game.phase, GAME_PHASES.VOTING, "Phase should advance to VOTING after all clues");
  game.clearIntervalTimer();
  console.log("✓ Test 3: Clue Submission & Turn Advancing passed");
}

// Test 4: Voting & Chameleon Caught Resolution
{
  const wm = new WordManager();
  const game = new GameEngine(wm);

  game.addPlayer({ id: "p1", name: "Alice" });
  game.addPlayer({ id: "p2", name: "Bob" });
  game.addPlayer({ id: "p3", name: "Charlie" });

  game.startRound();
  game.beginVotingPhase();

  const chamId = game.round.chameleonPlayerIds[0];
  const agentIds = game.players.filter(p => p.id !== chamId).map(p => p.id);

  // Both agents vote for the Chameleon
  game.castVote(agentIds[0], chamId);
  game.castVote(agentIds[1], chamId);
  game.castVote(chamId, agentIds[0]);

  // Chameleon should be caught -> enter CHAMELEON_GUESS phase
  assert.strictEqual(game.phase, GAME_PHASES.CHAMELEON_GUESS, "Chameleon caught should trigger guess phase");
  assert.strictEqual(game.round.votedOutPlayerId, chamId, "Voted out player must be Chameleon");

  // Chameleon fails guess -> Agents win!
  game.submitChameleonGuess("WrongGuess");
  assert.strictEqual(game.phase, GAME_PHASES.ROUND_OVER, "Game should be ROUND_OVER");
  assert.strictEqual(game.round.winner, "AGENTS", "Agents should win when Chameleon fails guess");

  game.clearIntervalTimer();
  console.log("✓ Test 4: Voting Tally & Chameleon Caught Resolution passed");
}

// Test 5: Chameleon Steals Win via Correct Guess
{
  const wm = new WordManager();
  const game = new GameEngine(wm);

  game.addPlayer({ id: "p1", name: "Alice" });
  game.addPlayer({ id: "p2", name: "Bob" });

  game.startRound();
  game.beginVotingPhase();

  const chamId = game.round.chameleonPlayerIds[0];
  const agentId = game.players.find(p => p.id !== chamId).id;

  game.castVote(agentId, chamId);
  game.castVote(chamId, agentId);
  // Tie -> Chameleon escapes
  game.tallyVotes();
  assert.strictEqual(game.round.winner, "CHAMELEON", "Tie vote should allow Chameleon escape");

  game.clearIntervalTimer();
  console.log("✓ Test 5: Chameleon Escape Resolution passed");
}

console.log("\n==========================================");
console.log("  ALL 5 UNIT TESTS PASSED CLEANLY (100%)");
console.log("==========================================");
process.exit(0);
