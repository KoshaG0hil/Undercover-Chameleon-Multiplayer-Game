/**
 * Undercover Chameleon - Authoritative Game Logic Engine
 * Manages player roles, round state transitions, timers, clue turns, voting, and scoring.
 */

const GAME_PHASES = {
  LOBBY: "LOBBY",
  BRIEFING: "BRIEFING",
  CLUES: "CLUES",
  VOTING: "VOTING",
  CHAMELEON_GUESS: "CHAMELEON_GUESS",
  ROUND_OVER: "ROUND_OVER"
};

class GameEngine {
  constructor(wordManager) {
    this.wordManager = wordManager || (typeof WordManager !== "undefined" ? new WordManager() : null);
    this.reset();
  }

  reset() {
    this.phase = GAME_PHASES.LOBBY;
    this.roomCode = "";
    this.hostPlayerId = null;
    this.players = []; // [{ id, name, avatar, isHost, score, role, isChameleon, connected }]
    this.settings = {
      turnTimerSeconds: 30,
      votingTimerSeconds: 45,
      activeCategories: ["cyberpunk", "tech", "food", "popculture", "landmarks", "espionage"],
      chameleonCount: 1
    };
    this.round = {
      number: 0,
      topic: null, // { categoryName, categoryIcon, categoryColor, secretWord, guessCandidates }
      chameleonPlayerIds: [],
      clueOrder: [], // [playerId, playerId, ...]
      currentTurnIndex: 0,
      clues: [], // [{ playerId, playerName, clue, timestamp }]
      timerRemaining: 0,
      timerActive: false,
      votes: {}, // voterId -> suspectPlayerId
      votedOutPlayerId: null,
      chameleonGuessedWord: null,
      winner: null, // "AGENTS" or "CHAMELEON"
      winReason: ""
    };
    this.timerInterval = null;
    this.onStateChange = () => {};
  }

  addPlayer(player) {
    const existingIndex = this.players.findIndex(p => p.id === player.id);
    if (existingIndex >= 0) {
      this.players[existingIndex].name = player.name;
      this.players[existingIndex].avatar = player.avatar;
      this.players[existingIndex].connected = true;
    } else {
      const isFirst = this.players.length === 0;
      this.players.push({
        id: player.id,
        name: player.name || `Agent ${this.players.length + 1}`,
        avatar: player.avatar || "fa-user-ninja",
        isHost: isFirst || player.isHost || false,
        score: 0,
        role: "AGENT",
        isChameleon: false,
        connected: true
      });
      if (isFirst) {
        this.hostPlayerId = player.id;
      }
    }
    this.emitState();
  }

  removePlayer(playerId) {
    const p = this.players.find(p => p.id === playerId);
    if (p) {
      p.connected = false;
      // If host disconnects, promote next connected player
      if (p.isHost && this.players.some(pl => pl.id !== playerId && pl.connected)) {
        p.isHost = false;
        const nextHost = this.players.find(pl => pl.id !== playerId && pl.connected);
        if (nextHost) {
          nextHost.isHost = true;
          this.hostPlayerId = nextHost.id;
        }
      }
    }
    this.emitState();
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.emitState();
  }

  /**
   * Starts a new round
   */
  startRound() {
    if (this.players.length < 2) {
      throw new Error("At least 2 players required to start the mission.");
    }

    this.clearIntervalTimer();
    this.round.number += 1;
    this.round.topic = this.wordManager.pickRoundTopic(this.settings.activeCategories);
    this.round.clues = [];
    this.round.votes = {};
    this.round.votedOutPlayerId = null;
    this.round.chameleonGuessedWord = null;
    this.round.winner = null;
    this.round.winReason = "";

    // 1. Assign Chameleon(s) randomly
    const connectedPlayers = this.players.filter(p => p.connected);
    const shuffled = [...connectedPlayers].sort(() => 0.5 - Math.random());
    const chamCount = Math.min(this.settings.chameleonCount, Math.max(1, Math.floor(connectedPlayers.length / 3)));
    const chameleons = shuffled.slice(0, chamCount);
    this.round.chameleonPlayerIds = chameleons.map(c => c.id);

    this.players.forEach(p => {
      p.isChameleon = this.round.chameleonPlayerIds.includes(p.id);
      p.role = p.isChameleon ? "CHAMELEON" : "AGENT";
    });

    // 2. Set Clue Turn Order (randomized for fairness)
    this.round.clueOrder = [...connectedPlayers.map(p => p.id)].sort(() => 0.5 - Math.random());
    this.round.currentTurnIndex = 0;

    // 3. Move to Briefing Phase (8 seconds)
    this.phase = GAME_PHASES.BRIEFING;
    this.startTimer(8, () => {
      this.beginCluePhase();
    });

    this.emitState();
  }

  beginCluePhase() {
    this.phase = GAME_PHASES.CLUES;
    this.round.currentTurnIndex = 0;
    this.startTurnTimer();
    this.emitState();
  }

  startTurnTimer() {
    this.clearIntervalTimer();
    this.startTimer(this.settings.turnTimerSeconds, () => {
      // Auto-submit placeholder clue if player runs out of time
      const activePlayerId = this.round.clueOrder[this.round.currentTurnIndex];
      const player = this.players.find(p => p.id === activePlayerId);
      this.submitClue(activePlayerId, "[Timed Out: Skipped]");
    });
  }

  submitClue(playerId, clueText) {
    if (this.phase !== GAME_PHASES.CLUES) return;

    const expectedPlayerId = this.round.clueOrder[this.round.currentTurnIndex];
    if (playerId !== expectedPlayerId) return;

    const player = this.players.find(p => p.id === playerId);
    const sanitizedClue = (clueText || "No Clue").trim().substring(0, 30);

    this.round.clues.push({
      playerId,
      playerName: player ? player.name : "Agent",
      avatar: player ? player.avatar : "fa-user-ninja",
      clue: sanitizedClue,
      timestamp: Date.now()
    });

    // Advance to next player
    this.round.currentTurnIndex += 1;

    if (this.round.currentTurnIndex >= this.round.clueOrder.length) {
      // All players gave clues -> Begin Voting Phase!
      this.beginVotingPhase();
    } else {
      this.startTurnTimer();
      this.emitState();
    }
  }

  beginVotingPhase() {
    this.clearIntervalTimer();
    this.phase = GAME_PHASES.VOTING;
    this.round.votes = {};

    this.startTimer(this.settings.votingTimerSeconds, () => {
      this.tallyVotes();
    });

    this.emitState();
  }

  castVote(voterId, suspectPlayerId) {
    if (this.phase !== GAME_PHASES.VOTING) return;
    if (voterId === suspectPlayerId) return; // Cannot vote for self

    this.round.votes[voterId] = suspectPlayerId;

    // If all connected players have voted, tally immediately!
    const activeCount = this.players.filter(p => p.connected).length;
    const votesCount = Object.keys(this.round.votes).length;

    if (votesCount >= activeCount) {
      this.clearIntervalTimer();
      this.tallyVotes();
    } else {
      this.emitState();
    }
  }

  tallyVotes() {
    this.clearIntervalTimer();

    // Count votes per player
    const tally = {};
    Object.values(this.round.votes).forEach(suspectId => {
      tally[suspectId] = (tally[suspectId] || 0) + 1;
    });

    let maxVotes = -1;
    let mostVotedId = null;
    let isTie = false;

    Object.entries(tally).forEach(([pId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedId = pId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });

    // If there is a tie or no votes, Chameleon escapes
    if (isTie || !mostVotedId || maxVotes === 0) {
      this.round.votedOutPlayerId = null;
      this.finishRound(
        "CHAMELEON",
        "The vote was tied or inconclusive! The Chameleon escaped undetected into the shadows."
      );
      return;
    }

    this.round.votedOutPlayerId = mostVotedId;
    const isChameleonCaught = this.round.chameleonPlayerIds.includes(mostVotedId);

    if (isChameleonCaught) {
      // Chameleon caught -> Enter Chameleon's Last Stand Guess Phase!
      this.beginChameleonGuessPhase();
    } else {
      // Innocent agent was voted out -> Chameleon wins!
      const votedPlayer = this.players.find(p => p.id === mostVotedId);
      const name = votedPlayer ? votedPlayer.name : "An innocent Agent";
      this.finishRound(
        "CHAMELEON",
        `${name} was falsely accused! The real Chameleon was never identified and took the victory.`
      );
    }
  }

  beginChameleonGuessPhase() {
    this.clearIntervalTimer();
    this.phase = GAME_PHASES.CHAMELEON_GUESS;

    // 25-second window for Chameleon to guess the secret word from candidates
    this.startTimer(25, () => {
      this.submitChameleonGuess("[Time Expired]");
    });

    this.emitState();
  }

  submitChameleonGuess(guessedWord) {
    if (this.phase !== GAME_PHASES.CHAMELEON_GUESS) return;
    this.clearIntervalTimer();

    this.round.chameleonGuessedWord = guessedWord;
    const isCorrect = guessedWord.toLowerCase().trim() === this.round.topic.secretWord.toLowerCase().trim();

    if (isCorrect) {
      this.finishRound(
        "CHAMELEON",
        `The Chameleon was caught, but correctly deduced the secret word: "${this.round.topic.secretWord}"! Mastermind victory!`
      );
    } else {
      this.finishRound(
        "AGENTS",
        `The Chameleon was caught and guessed "${guessedWord}" incorrectly! The Agents protect the secret: "${this.round.topic.secretWord}".`
      );
    }
  }

  finishRound(winner, winReason) {
    this.clearIntervalTimer();
    this.phase = GAME_PHASES.ROUND_OVER;
    this.round.winner = winner;
    this.round.winReason = winReason;

    // Award Points
    if (winner === "CHAMELEON") {
      this.players.forEach(p => {
        if (p.isChameleon) p.score += 2;
      });
    } else {
      this.players.forEach(p => {
        if (!p.isChameleon) p.score += 1;
      });
    }

    this.emitState();
  }

  startTimer(durationSeconds, onExpire) {
    this.clearIntervalTimer();
    this.round.timerRemaining = durationSeconds;
    this.round.timerActive = true;

    this.timerInterval = setInterval(() => {
      this.round.timerRemaining -= 1;
      if (this.round.timerRemaining <= 0) {
        this.clearIntervalTimer();
        if (onExpire) onExpire();
      } else {
        this.emitState();
      }
    }, 1000);
  }

  clearIntervalTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.round.timerActive = false;
  }

  /**
   * Produces a sanitized, player-specific state snapshot
   * (Crucial: Secret Word is HIDDEN from Chameleon players!)
   */
  getStateForPlayer(playerId) {
    const isCham = this.round.chameleonPlayerIds.includes(playerId);
    const isRoundOver = this.phase === GAME_PHASES.ROUND_OVER;

    // Clone topic object
    let topicView = null;
    if (this.round.topic) {
      topicView = {
        categoryName: this.round.topic.categoryName,
        categoryIcon: this.round.topic.categoryIcon,
        categoryColor: this.round.topic.categoryColor,
        guessCandidates: this.round.topic.guessCandidates,
        // Hide secret word if player is Chameleon and round is active
        secretWord: (isCham && !isRoundOver) ? "??? [SECRET MASKED]" : this.round.topic.secretWord
      };
    }

    return {
      phase: this.phase,
      roomCode: this.roomCode,
      hostPlayerId: this.hostPlayerId,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        isHost: p.isHost,
        connected: p.connected,
        // Only reveal roles when round is over or for the player themselves
        role: (isRoundOver || p.id === playerId) ? p.role : "UNKNOWN",
        isChameleon: (isRoundOver || p.id === playerId) ? p.isChameleon : false
      })),
      settings: this.settings,
      round: {
        number: this.round.number,
        topic: topicView,
        currentTurnIndex: this.round.currentTurnIndex,
        currentTurnPlayerId: this.round.clueOrder[this.round.currentTurnIndex] || null,
        clueOrder: this.round.clueOrder,
        clues: this.round.clues,
        timerRemaining: this.round.timerRemaining,
        timerActive: this.round.timerActive,
        votedOutPlayerId: this.round.votedOutPlayerId,
        chameleonGuessedWord: this.round.chameleonGuessedWord,
        winner: this.round.winner,
        winReason: this.round.winReason,
        hasVoted: Boolean(this.round.votes[playerId]),
        voteCount: Object.keys(this.round.votes).length
      }
    };
  }

  getAuthoritativeState() {
    return {
      phase: this.phase,
      roomCode: this.roomCode,
      hostPlayerId: this.hostPlayerId,
      players: this.players,
      settings: this.settings,
      round: this.round
    };
  }

  loadState(syncedState) {
    this.phase = syncedState.phase;
    this.roomCode = syncedState.roomCode;
    this.hostPlayerId = syncedState.hostPlayerId;
    this.players = syncedState.players;
    this.settings = syncedState.settings;
    this.round = syncedState.round;
    this.emitState();
  }

  emitState() {
    if (this.onStateChange) {
      this.onStateChange(this.getAuthoritativeState());
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { GameEngine, GAME_PHASES };
}
