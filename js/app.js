/**
 * Undercover Chameleon - Client Application Controller
 * Handles UI transitions, user interactions, audio triggers, and network sync.
 */

class ApplicationController {
  constructor() {
    this.words = new WordManager();
    this.game = new GameEngine(this.words);
    this.network = new NetworkCoordinator();

    // Local Player Identity
    this.playerId = "p-" + Math.random().toString(36).substring(2, 9);
    this.playerName = localStorage.getItem("chameleon_codename") || "Agent " + Math.floor(Math.random() * 900 + 100);
    this.playerAvatar = localStorage.getItem("chameleon_avatar") || "fa-user-ninja";
    this.isHost = false;
    this.selectedSuspectId = null;
    this.qrCodeInstance = null;

    this.availableAvatars = [
      { id: "fa-user-ninja", label: "Ninja" },
      { id: "fa-user-secret", label: "Spy" },
      { id: "fa-robot", label: "Cyborg" },
      { id: "fa-ghost", label: "Phantom" },
      { id: "fa-skull", label: "Reaper" },
      { id: "fa-dragon", label: "Dragon" },
      { id: "fa-mask", label: "Chameleon" },
      { id: "fa-biohazard", label: "Hazard" }
    ];

    this.init();
  }

  init() {
    // 1. Populate UI inputs
    const nameInput = document.getElementById("playerNameInput");
    if (nameInput) nameInput.value = this.playerName;

    this.renderAvatarPicker();
    this.bindNetworkEvents();
    this.checkUrlForRoomCode();

    // Sound toggle listener
    const soundBtn = document.getElementById("soundBtn");
    if (soundBtn) {
      soundBtn.title = "Toggle Sound Effects";
    }
  }

  renderAvatarPicker() {
    const container = document.getElementById("avatarPicker");
    if (!container) return;

    container.innerHTML = this.availableAvatars.map(av => `
      <button type="button" onclick="app.selectAvatar('${av.id}')" 
              class="avatar-option p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                this.playerAvatar === av.id 
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 avatar-active" 
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
              }">
        <i class="fa-solid ${av.id} text-xl mb-1"></i>
        <span class="text-[9px] font-mono">${av.label}</span>
      </button>
    `).join("");
  }

  selectAvatar(avatarId) {
    this.playerAvatar = avatarId;
    localStorage.setItem("chameleon_avatar", avatarId);
    this.renderAvatarPicker();
    audio.playBlip();
  }

  checkUrlForRoomCode() {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      this.showJoinSection();
      const roomInput = document.getElementById("roomCodeInput");
      if (roomInput) roomInput.value = roomParam.toUpperCase().trim();
    }
  }

  showJoinSection() {
    const sec = document.getElementById("joinSection");
    if (sec) sec.classList.remove("hidden");
    audio.playBlip();
  }

  showLanding() {
    this.showView("viewLanding");
    document.getElementById("navRoomBadge").classList.add("hidden");
    document.getElementById("settingsBtn").classList.add("hidden");
  }

  showView(viewId) {
    const views = [
      "viewLanding",
      "viewLobby",
      "viewBriefing",
      "viewClues",
      "viewVoting",
      "viewChameleonGuess",
      "viewRoundOver"
    ];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add("hidden");
    });

    const activeView = document.getElementById(viewId);
    if (activeView) activeView.classList.remove("hidden");
  }

  getProfileInfo() {
    const nameInput = document.getElementById("playerNameInput");
    const name = (nameInput?.value || this.playerName).trim() || "Agent Zero";
    this.playerName = name;
    localStorage.setItem("chameleon_codename", name);
    return {
      id: this.playerId,
      name: this.playerName,
      avatar: this.playerAvatar,
      isHost: this.isHost
    };
  }

  // =========================================================================
  // HOST & JOIN HANDLERS
  // =========================================================================

  async hostGame() {
    audio.playBlip();
    this.isHost = true;
    const player = this.getProfileInfo();
    player.isHost = true;

    this.showToast("Initializing secure room broker...");

    try {
      const { roomCode } = await this.network.createRoom();
      this.game.reset();
      this.game.roomCode = roomCode;
      this.game.addPlayer(player);

      this.updateRoomBadge(roomCode);
      this.showView("viewLobby");
      this.renderLobby();
      document.getElementById("settingsBtn").classList.remove("hidden");

      this.showToast(`Room ${roomCode} created! Share the code with friends.`);
      audio.playPlayerJoin();
    } catch (err) {
      console.error(err);
      this.showToast("Connection issue. Retrying room creation...");
      // Auto-fallback with local play
      this.updateRoomBadge("CYBR");
      this.showView("viewLobby");
      this.renderLobby();
    }
  }

  async joinGame() {
    audio.playBlip();
    this.isHost = false;
    const roomInput = document.getElementById("roomCodeInput");
    const roomCode = roomInput?.value.toUpperCase().trim();

    if (!roomCode || roomCode.length < 3) {
      this.showToast("Please enter a valid room code.");
      return;
    }

    const player = this.getProfileInfo();
    player.isHost = false;

    this.showToast(`Connecting to room ${roomCode}...`);

    try {
      await this.network.joinRoom(roomCode, player);
      this.updateRoomBadge(roomCode);
      this.showView("viewLobby");
      document.getElementById("hostLobbyControls").classList.add("hidden");
      document.getElementById("clientLobbyWait").classList.remove("hidden");
      document.getElementById("settingsBtn").classList.add("hidden");
      this.showToast(`Connected to Room ${roomCode}!`);
      audio.playPlayerJoin();
    } catch (err) {
      console.error(err);
      this.showToast("Could not find room. Please check the code.");
    }
  }

  updateRoomBadge(roomCode) {
    const badge = document.getElementById("navRoomBadge");
    const codeSpan = document.getElementById("navRoomCode");
    const lobbyCodeSpan = document.getElementById("lobbyRoomCode");
    const qrCodeSpan = document.getElementById("qrRoomCode");

    if (badge) badge.classList.remove("hidden");
    if (codeSpan) codeSpan.innerText = roomCode;
    if (lobbyCodeSpan) lobbyCodeSpan.innerText = roomCode;
    if (qrCodeSpan) qrCodeSpan.innerText = roomCode;

    // Update browser URL query param without reload
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${roomCode}`;
    window.history.replaceState({ path: newUrl }, "", newUrl);
  }

  // =========================================================================
  // NETWORK & STATE BINDINGS
  // =========================================================================

  bindNetworkEvents() {
    // 1. Host received state from game engine -> broadcast to clients
    this.game.onStateChange = (state) => {
      if (this.isHost) {
        this.network.broadcastState(state);
      }
      this.handleStateUpdate(state);
    };

    // 2. Client received updated state from Host
    this.network.onStateReceived = (state) => {
      this.game.loadState(state);
      this.handleStateUpdate(state);
    };

    // 3. Host receives a new player connection
    this.network.onPeerJoin = (playerInfo, peerId) => {
      if (this.isHost) {
        this.game.addPlayer(playerInfo);
        audio.playPlayerJoin();
        this.showToast(`${playerInfo.name} joined the mission!`);
      }
    };

    // 4. Host receives a client action
    this.network.onPlayerAction = (action) => {
      if (!this.isHost) return;

      switch (action.type) {
        case "SUBMIT_CLUE":
          this.game.submitClue(action.playerId, action.clue);
          break;
        case "VOTE":
          this.game.castVote(action.voterId, action.suspectId);
          break;
        case "CHAMELEON_GUESS":
          this.game.submitChameleonGuess(action.guessWord);
          break;
        case "RESTART":
          this.game.startRound();
          break;
      }
    };

    this.network.onError = (err) => {
      console.warn("Network notice:", err);
    };
  }

  handleStateUpdate(state) {
    const phase = state.phase;

    switch (phase) {
      case "LOBBY":
        this.showView("viewLobby");
        this.renderLobby();
        break;
      case "BRIEFING":
        this.showView("viewBriefing");
        this.renderBriefing();
        break;
      case "CLUES":
        this.showView("viewClues");
        this.renderClues();
        break;
      case "VOTING":
        this.showView("viewVoting");
        this.renderVoting();
        break;
      case "CHAMELEON_GUESS":
        this.showView("viewChameleonGuess");
        this.renderChameleonGuess();
        break;
      case "ROUND_OVER":
        this.showView("viewRoundOver");
        this.renderRoundOver();
        break;
    }
  }

  // =========================================================================
  // VIEW RENDERERS
  // =========================================================================

  renderLobby() {
    const players = this.game.players;
    const roster = document.getElementById("rosterGrid");
    const countBadge = document.getElementById("playerCountBadge");
    const startBtn = document.getElementById("startGameBtn");

    if (countBadge) {
      countBadge.innerText = `${players.length} Ready`;
    }

    if (startBtn) {
      startBtn.disabled = players.length < 2;
      startBtn.classList.toggle("opacity-50", players.length < 2);
    }

    if (roster) {
      roster.innerHTML = players.map(p => `
        <div class="p-3 rounded-xl bg-slate-900 border ${p.id === this.playerId ? "border-cyan-500/80" : "border-slate-800"} flex items-center space-x-3">
          <div class="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <i class="fa-solid ${p.avatar}"></i>
          </div>
          <div class="truncate">
            <div class="text-xs font-bold font-mono text-white truncate flex items-center gap-1">
              <span>${p.name}</span>
              ${p.isHost ? '<i class="fa-solid fa-crown text-amber-400 text-[10px]" title="Room Host"></i>' : ""}
            </div>
            <div class="text-[10px] text-emerald-400 font-mono">Connected</div>
          </div>
        </div>
      `).join("");
    }
  }

  renderBriefing() {
    const pState = this.game.getStateForPlayer(this.playerId);
    const round = pState.round;
    const isCham = pState.players.find(p => p.id === this.playerId)?.isChameleon;

    const catBadge = document.getElementById("briefingCategoryBadge");
    const roleHeader = document.getElementById("briefingRoleHeader");
    const wordBox = document.getElementById("briefingWordBox");
    const secretWordEl = document.getElementById("briefingSecretWord");
    const instructions = document.getElementById("briefingInstructions");
    const timerEl = document.getElementById("briefingTimer");

    if (timerEl) timerEl.innerText = round.timerRemaining;

    if (isCham) {
      audio.playRoleReveal(true);
      if (catBadge) {
        catBadge.innerText = `CATEGORY: ${round.topic.categoryName.toUpperCase()}`;
        catBadge.className = "text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 font-bold";
      }
      if (roleHeader) {
        roleHeader.innerHTML = '<span class="text-rose-500">YOU ARE THE CHAMELEON!</span>';
      }
      if (wordBox) {
        wordBox.className = "p-6 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-2 glow-pink";
      }
      if (secretWordEl) {
        secretWordEl.innerText = "??? [SECRET MASKED]";
        secretWordEl.className = "text-3xl sm:text-4xl font-cyber font-black tracking-wider text-rose-400 text-glow-pink";
      }
      if (instructions) {
        instructions.innerText = "You have NO IDEA what the secret word is! Listen closely to other agents' clues, give a plausible vague clue, and blend in without getting detected!";
      }
    } else {
      audio.playRoleReveal(false);
      if (catBadge) {
        catBadge.innerText = `CATEGORY: ${round.topic.categoryName.toUpperCase()}`;
        catBadge.className = "text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold";
      }
      if (roleHeader) {
        roleHeader.innerHTML = '<span class="text-cyan-400">YOU ARE AN AGENT</span>';
      }
      if (wordBox) {
        wordBox.className = "p-6 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2 glow-cyan";
      }
      if (secretWordEl) {
        secretWordEl.innerText = round.topic.secretWord.toUpperCase();
        secretWordEl.className = "text-3xl sm:text-4xl font-cyber font-black tracking-wider text-cyan-400 text-glow-cyan";
      }
      if (instructions) {
        instructions.innerText = "You know the secret word. When your turn comes, submit a 1-word clue proving you know it, without giving it away to the Chameleon!";
      }
    }
  }

  renderClues() {
    const pState = this.game.getStateForPlayer(this.playerId);
    const round = pState.round;
    const activePlayerId = round.currentTurnPlayerId;
    const activePlayer = pState.players.find(p => p.id === activePlayerId);

    const turnAvatar = document.getElementById("turnAvatar");
    const turnName = document.getElementById("turnPlayerName");
    const turnTimer = document.getElementById("turnTimer");
    const clueCard = document.getElementById("myClueInputCard");
    const waitCard = document.getElementById("waitingTurnCard");
    const feed = document.getElementById("clueFeed");
    const countText = document.getElementById("clueCountText");
    const catHint = document.getElementById("clueCategoryHint");

    if (turnAvatar && activePlayer) {
      turnAvatar.innerHTML = `<i class="fa-solid ${activePlayer.avatar}"></i>`;
    }
    if (turnName && activePlayer) {
      turnName.innerText = activePlayer.name;
    }
    if (turnTimer) {
      turnTimer.innerText = `${round.timerRemaining}s`;
    }
    if (catHint && round.topic) {
      catHint.innerText = `Category: ${round.topic.categoryName}`;
    }

    const isMyTurn = activePlayerId === this.playerId;
    if (clueCard) clueCard.classList.toggle("hidden", !isMyTurn);
    if (waitCard) waitCard.classList.toggle("hidden", isMyTurn);

    if (countText) {
      countText.innerText = `${round.clues.length} of ${round.clueOrder.length} Submitted`;
    }

    if (feed) {
      if (round.clues.length === 0) {
        feed.innerHTML = `<div class="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-mono text-xs text-center">Awaiting first clue transmission...</div>`;
      } else {
        feed.innerHTML = round.clues.map(c => `
          <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <div class="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 text-xs">
                <i class="fa-solid ${c.avatar}"></i>
              </div>
              <span class="text-xs font-mono font-bold text-white">${c.playerName}:</span>
            </div>
            <span class="text-xs font-cyber font-black tracking-wider text-cyan-300 px-3 py-1 rounded bg-cyan-950/80 border border-cyan-800/80">"${c.clue}"</span>
          </div>
        `).join("");
      }
    }
  }

  submitClue() {
    const input = document.getElementById("clueTextInput");
    const clue = (input?.value || "").trim();
    if (!clue) {
      this.showToast("Please enter a clue word!");
      return;
    }

    if (this.isHost) {
      this.game.submitClue(this.playerId, clue);
    } else {
      this.network.sendActionToHost({
        type: "SUBMIT_CLUE",
        playerId: this.playerId,
        clue: clue
      });
    }

    if (input) input.value = "";
    audio.playBlip();
  }

  renderVoting() {
    const pState = this.game.getStateForPlayer(this.playerId);
    const round = pState.round;
    const suspectsGrid = document.getElementById("suspectsGrid");
    const timerEl = document.getElementById("votingTimer");
    const statusText = document.getElementById("voteStatusText");

    if (timerEl) timerEl.innerText = round.timerRemaining;

    if (round.hasVoted) {
      if (statusText) statusText.innerHTML = `<span class="text-emerald-400 font-bold"><i class="fa-solid fa-check"></i> Vote Encrypted & Locked In! Waiting for others...</span>`;
    }

    // Grid of all players except self
    const otherPlayers = pState.players.filter(p => p.id !== this.playerId && p.connected);
    if (suspectsGrid) {
      suspectsGrid.innerHTML = otherPlayers.map(p => {
        const clueObj = round.clues.find(c => c.playerId === p.id);
        const clueText = clueObj ? clueObj.clue : "No Clue";
        const isSelected = this.selectedSuspectId === p.id;

        return `
          <button type="button" onclick="app.castVote('${p.id}')" 
                  ${round.hasVoted ? "disabled" : ""}
                  class="p-4 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? "bg-rose-950/60 border-rose-500 glow-pink" 
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  } ${round.hasVoted ? "opacity-60 cursor-not-allowed" : ""}">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2.5">
                <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-rose-400">
                  <i class="fa-solid ${p.avatar}"></i>
                </div>
                <span class="text-xs font-mono font-bold text-white">${p.name}</span>
              </div>
              ${isSelected ? '<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 font-bold">LOCKED</span>' : ""}
            </div>
            <div class="text-[11px] font-mono text-slate-400">
              Submitted Clue: <strong class="text-cyan-300">"${clueText}"</strong>
            </div>
          </button>
        `;
      }).join("");
    }
  }

  castVote(suspectId) {
    if (this.game.round.votes[this.playerId]) return; // Already voted

    this.selectedSuspectId = suspectId;
    audio.playVoteCast();
    audio.vibrate([100]);

    if (this.isHost) {
      this.game.castVote(this.playerId, suspectId);
    } else {
      this.network.sendActionToHost({
        type: "VOTE",
        voterId: this.playerId,
        suspectId: suspectId
      });
    }

    this.renderVoting();
  }

  renderChameleonGuess() {
    const pState = this.game.getStateForPlayer(this.playerId);
    const round = pState.round;
    const isCham = pState.players.find(p => p.id === this.playerId)?.isChameleon;

    const grid = document.getElementById("guessCandidatesGrid");
    const waitText = document.getElementById("chameleonWaitText");

    if (isCham) {
      if (waitText) waitText.classList.add("hidden");
      if (grid) {
        grid.innerHTML = (round.topic.guessCandidates || []).map(word => `
          <button type="button" onclick="app.submitChameleonGuess('${word}')" 
                  class="p-4 rounded-xl bg-slate-900/90 hover:bg-pink-950/60 border border-slate-700 hover:border-pink-500 font-cyber font-bold text-xs text-white transition-all">
            ${word}
          </button>
        `).join("");
      }
    } else {
      if (grid) grid.innerHTML = "";
      if (waitText) waitText.classList.remove("hidden");
    }
  }

  submitChameleonGuess(guessedWord) {
    audio.playVoteCast();

    if (this.isHost) {
      this.game.submitChameleonGuess(guessedWord);
    } else {
      this.network.sendActionToHost({
        type: "CHAMELEON_GUESS",
        guessWord: guessedWord
      });
    }
  }

  renderRoundOver() {
    const pState = this.game.getStateForPlayer(this.playerId);
    const round = pState.round;

    const winnerIcon = document.getElementById("winnerIcon");
    const winnerTitle = document.getElementById("winnerTitle");
    const winnerReason = document.getElementById("winnerReason");
    const secretWordEl = document.getElementById("revealedSecretWord");
    const scoreboardList = document.getElementById("scoreboardList");
    const nextBtn = document.getElementById("hostNextRoundControls");
    const clientWait = document.getElementById("clientNextRoundWait");

    if (nextBtn) nextBtn.classList.toggle("hidden", !this.isHost);
    if (clientWait) clientWait.classList.toggle("hidden", this.isHost);

    if (round.winner === "CHAMELEON") {
      audio.playRoleReveal(true);
      if (winnerIcon) {
        winnerIcon.className = "w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-pink-950 text-pink-400 border-2 border-pink-500 glow-pink";
        winnerIcon.innerHTML = '<i class="fa-solid fa-mask"></i>';
      }
      if (winnerTitle) {
        winnerTitle.innerText = "CHAMELEON WINS!";
        winnerTitle.className = "text-3xl font-cyber font-black tracking-tight text-pink-400 text-glow-pink";
      }
    } else {
      audio.playVictory();
      this.triggerConfetti();
      if (winnerIcon) {
        winnerIcon.className = "w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-cyan-950 text-cyan-400 border-2 border-cyan-500 glow-cyan";
        winnerIcon.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
      }
      if (winnerTitle) {
        winnerTitle.innerText = "AGENTS PREVAIL!";
        winnerTitle.className = "text-3xl font-cyber font-black tracking-tight text-cyan-400 text-glow-cyan";
      }
    }

    if (winnerReason) winnerReason.innerText = round.winReason;
    if (secretWordEl && round.topic) {
      secretWordEl.innerText = round.topic.secretWord.toUpperCase();
    }

    // Leaderboard sorted by score
    const sortedPlayers = [...pState.players].sort((a, b) => b.score - a.score);
    if (scoreboardList) {
      scoreboardList.innerHTML = sortedPlayers.map((p, rank) => `
        <div class="p-3 rounded-xl bg-slate-900 border ${rank === 0 ? "border-amber-500/80" : "border-slate-800"} flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="font-cyber font-bold text-xs ${rank === 0 ? "text-amber-400" : "text-slate-500"}">#${rank + 1}</span>
            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 text-xs">
              <i class="fa-solid ${p.avatar}"></i>
            </div>
            <div>
              <span class="text-xs font-mono font-bold text-white">${p.name}</span>
              ${p.isChameleon ? '<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-pink-950 text-pink-400 border border-pink-800 ml-1">Chameleon</span>' : ""}
            </div>
          </div>
          <span class="text-sm font-cyber font-black text-cyan-400">${p.score} PTS</span>
        </div>
      `).join("");
    }
  }

  // =========================================================================
  // ACTIONS & MODALS
  // =========================================================================

  startGame() {
    if (!this.isHost) return;
    audio.playBlip();
    this.game.startRound();
  }

  nextRound() {
    if (!this.isHost) return;
    audio.playBlip();
    this.selectedSuspectId = null;
    this.game.startRound();
  }

  copyRoomLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast("Mission invite link copied to clipboard!");
      audio.playBlip();
    });
  }

  openQRModal() {
    const modal = document.getElementById("qrModal");
    const qrContainer = document.getElementById("qrcode");
    if (modal) modal.classList.remove("hidden");

    if (qrContainer) {
      qrContainer.innerHTML = "";
      this.qrCodeInstance = new QRCode(qrContainer, {
        text: window.location.href,
        width: 180,
        height: 180,
        colorDark: "#070b14",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    }
    audio.playBlip();
  }

  closeQRModal() {
    const modal = document.getElementById("qrModal");
    if (modal) modal.classList.add("hidden");
  }

  openRulesModal() {
    const modal = document.getElementById("rulesModal");
    if (modal) modal.classList.remove("hidden");
    audio.playBlip();
  }

  closeRulesModal() {
    const modal = document.getElementById("rulesModal");
    if (modal) modal.classList.add("hidden");
  }

  openSettingsModal() {
    if (!this.isHost) return;
    const modal = document.getElementById("settingsModal");
    if (modal) modal.classList.remove("hidden");

    const catContainer = document.getElementById("settingsCategoriesList");
    if (catContainer) {
      catContainer.innerHTML = this.words.getAllCategories().map(c => `
        <label class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-2 cursor-pointer hover:border-slate-700">
          <input type="checkbox" value="${c.id}" ${this.game.settings.activeCategories.includes(c.id) ? "checked" : ""} class="rounded bg-slate-800 border-slate-700 text-cyan-500">
          <span class="text-[11px] font-mono text-slate-300 truncate">${c.name}</span>
        </label>
      `).join("");
    }
    audio.playBlip();
  }

  closeSettingsModal() {
    const modal = document.getElementById("settingsModal");
    if (modal) modal.classList.add("hidden");
  }

  saveSettings() {
    const turnVal = parseInt(document.getElementById("settingTurnTimer")?.value) || 30;
    const chamVal = parseInt(document.getElementById("settingChameleonCount")?.value) || 1;

    const checkboxes = document.querySelectorAll("#settingsCategoriesList input[type='checkbox']:checked");
    const cats = Array.from(checkboxes).map(cb => cb.value);

    this.game.updateSettings({
      turnTimerSeconds: turnVal,
      chameleonCount: chamVal,
      activeCategories: cats.length > 0 ? cats : ["cyberpunk", "tech"]
    });

    this.closeSettingsModal();
    this.showToast("Mission parameters updated!");
    audio.playBlip();
  }

  toggleSound() {
    const muted = audio.toggleMute();
    const btn = document.getElementById("soundBtn");
    if (btn) {
      btn.innerHTML = muted 
        ? '<i class="fa-solid fa-volume-xmark text-sm text-rose-400"></i>' 
        : '<i class="fa-solid fa-volume-high text-sm text-slate-300"></i>';
    }
    this.showToast(muted ? "Sound muted" : "Sound enabled");
  }

  triggerConfetti() {
    if (typeof confetti === "function") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#06b6d4", "#ec4899", "#f59e0b", "#3b82f6"]
      });
    }
  }

  showToast(message) {
    const toast = document.getElementById("toast");
    const msg = document.getElementById("toastMessage");
    if (toast && msg) {
      msg.innerText = message;
      toast.classList.remove("hidden");
      setTimeout(() => {
        toast.classList.add("hidden");
      }, 3000);
    }
  }
}

// Global App Instance
const app = new ApplicationController();
