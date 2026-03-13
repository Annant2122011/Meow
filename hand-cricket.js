/* =========================================================
   CRICPULSE FUN-GUN ARENA | CAREER AI & PERFECT PDF ENGINE
   ========================================================= */

// Game State Object
let gameState = {
    maxWickets: 3,
    maxBalls: 30,
    aiDifficulty: 'easy',
    playerHistory: [], // Kept for short-term fallback
    tossChoice: null,
    isPlayerBatting: null,
    innings: 1,
    target: null,
    gameOver: false,
    isTransitioning: false, 
    playerConsecZeros: 0,
    compConsecZeros: 0,
    commentaryHistory: [], 
    playerStats: { runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0, wicketsLost: 0 },
    compStats:   { runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0, wicketsLost: 0 }
};

let currentUser = null;
const handEmojis = { 0: '🛡️', 1: '☝️', 2: '✌️', 3: '🤟', 4: '🖖', 5: '🖐️', 6: '🤙' };

const tossStep1 = document.getElementById('toss-step-1');
const tossStep2 = document.getElementById('toss-step-2');
const tossChoiceText = document.getElementById('toss-choice-text');
const tossResultScreen = document.getElementById('toss-result-screen');
const playerDecisionBox = document.getElementById('player-decision-box');
const computerDecisionBox = document.getElementById('computer-decision-box');
const matchScreen = document.getElementById('match-screen');
const tossScreen = document.getElementById('toss-screen');
const setupScreen = document.getElementById('setup-screen');
const inningsStatus = document.getElementById('innings-status');
const commentaryBox = document.getElementById('hand-commentary');
const targetBox = document.getElementById('target-box');
const targetScoreUi = document.getElementById('target-score');
const actionArea = document.getElementById('hand-action-area');
const zeroBtn = document.getElementById('zero-btn'); 

window.onload = function() {
    const storedUser = localStorage.getItem('hc_currentUser');
    if (storedUser) {
        loadUser(storedUser);
    } else {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.style.display = 'flex';
    }
};

function loginUser() {
    const username = document.getElementById('username-input').value.trim().toUpperCase();
    if (!username) { alert("Arena requires a Player Name!"); return; }
    
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    if (!usersDB[username]) {
        usersDB[username] = {
            matches: 0, wins: 0, losses: 0, ties: 0,
            totalRuns: 0, totalBallsFaced: 0, totalDismissals: 0,
            totalRunsConceded: 0, totalBallsBowled: 0,
            totalWicketsTaken: 0, ducks: 0, highestScore: 0,
            bestSpellRuns: null,
            // NEW: Career Tracking for Pro AI!
            battingThrows: { '0':0, '1':0, '2':0, '3':0, '4':0, '5':0, '6':0 },
            bowlingThrows: { '0':0, '1':0, '2':0, '3':0, '4':0, '5':0, '6':0 }
        };
        localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
    }
    
    // Patch existing users who don't have throw tracking yet
    if (!usersDB[username].battingThrows) {
        usersDB[username].battingThrows = { '0':0, '1':0, '2':0, '3':0, '4':0, '5':0, '6':0 };
        usersDB[username].bowlingThrows = { '0':0, '1':0, '2':0, '3':0, '4':0, '5':0, '6':0 };
        localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
    }
    
    localStorage.setItem('hc_currentUser', username);
    loadUser(username);
}

function loadUser(username) {
    currentUser = username;
    const loginModal = document.getElementById('login-modal');
    const profileBtn = document.getElementById('user-profile-btn');
    const avatarText = document.getElementById('avatar-text');
    const profAvatarLetter = document.getElementById('prof-avatar-letter');
    
    if (loginModal) loginModal.style.display = 'none';
    if (profileBtn) profileBtn.style.display = 'block';
    
    const initial = username.charAt(0);
    if (avatarText) avatarText.innerText = initial;
    if (profAvatarLetter) profAvatarLetter.innerText = initial;
    
    if (setupScreen) setupScreen.style.display = 'block';
}

function logoutUser() {
    localStorage.removeItem('hc_currentUser');
    location.reload();
}

function openProfile() {
    const usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    const stats = usersDB[currentUser];
    
    if (!stats) {
        logoutUser();
        return;
    }
    
    document.getElementById('prof-username').innerText = currentUser;
    document.getElementById('prof-matches').innerText = stats.matches;
    document.getElementById('prof-wins').innerText = stats.wins;
    document.getElementById('prof-losses').innerText = stats.losses;
    document.getElementById('prof-ties').innerText = stats.ties;
    document.getElementById('prof-total-runs').innerText = stats.totalRuns || 0;
    document.getElementById('prof-total-wickets').innerText = stats.totalWicketsTaken || 0;
    document.getElementById('prof-hs').innerText = stats.highestScore;
    document.getElementById('prof-ducks').innerText = stats.ducks;
    
    const dismissals = stats.totalDismissals || 0;
    let batAvg = "0.00";
    if (dismissals > 0) batAvg = (stats.totalRuns / dismissals).toFixed(2);
    else if (stats.totalRuns > 0) batAvg = stats.totalRuns.toFixed(2) + "*";
    document.getElementById('prof-bat-avg').innerText = batAvg;

    const wickets = stats.totalWicketsTaken || 0;
    document.getElementById('prof-bowl-avg').innerText = wickets > 0 ? (stats.totalRunsConceded / wickets).toFixed(2) : "-";

    const avgSR = stats.totalBallsFaced > 0 ? ((stats.totalRuns / stats.totalBallsFaced) * 100).toFixed(2) : "0.00";
    const oversBowled = stats.totalBallsBowled / 6;
    const avgEco = oversBowled > 0 ? (stats.totalRunsConceded / oversBowled).toFixed(2) : "0.00";
    
    document.getElementById('prof-sr').innerText = avgSR;
    document.getElementById('prof-eco').innerText = avgEco;
    
    const bestSpell = stats.bestSpellRuns === null ? "-" : `Multi-Wkt/${stats.bestSpellRuns}`;
    document.getElementById('prof-best-spell').innerText = bestSpell;
    
    document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfile() {
    document.getElementById('profile-modal').style.display = 'none';
}

function setFormat(wickets, balls, btnId) {
    gameState.maxWickets = wickets;
    gameState.maxBalls = balls;
    document.querySelectorAll('.setup-btn').forEach(btn => {
        if(btn.id && btn.id.startsWith('btn-fmt')) btn.classList.remove('active-setup-btn');
    });
    const activeBtn = document.getElementById(btnId);
    if (activeBtn) activeBtn.classList.add('active-setup-btn');
}

function setDifficulty(level, btnId) {
    gameState.aiDifficulty = level;
    document.querySelectorAll('.setup-btn').forEach(btn => {
        if(btn.id && btn.id.startsWith('btn-diff')) btn.classList.remove('active-setup-btn');
    });
    const activeBtn = document.getElementById(btnId);
    if (activeBtn) activeBtn.classList.add('active-setup-btn');
}

function goToToss() {
    if (setupScreen) setupScreen.style.display = 'none';
    if (tossScreen) tossScreen.style.display = 'block';
}

function chooseToss(choice) {
    gameState.tossChoice = choice;
    tossStep1.style.display = 'none';
    tossStep2.style.display = 'block';
    tossChoiceText.innerText = `You chose ${choice.toUpperCase()}`;
}

function playToss(playerNum) {
    tossStep2.style.display = 'none';
    tossResultScreen.style.display = 'block';
    
    const compNum = Math.floor(Math.random() * 6) + 1; 
    const sum = playerNum + compNum;
    const isSumEven = sum % 2 === 0;
    
    document.getElementById('toss-player-hand').innerText = handEmojis[playerNum];
    document.getElementById('toss-computer-hand').innerText = handEmojis[compNum];
    document.getElementById('toss-sum-text').innerText = `${playerNum} + ${compNum} = ${sum} (${isSumEven ? 'Even' : 'Odd'})`;
    
    const playerWins = (gameState.tossChoice === 'even' && isSumEven) || (gameState.tossChoice === 'odd' && !isSumEven);
    gameState.commentaryHistory.push(`🪙 TOSS: You threw ${playerNum}, Computer threw ${compNum}. ${playerWins ? 'You won!' : 'Computer won.'}`);

    if (playerWins) {
        document.getElementById('toss-winner-text').innerText = "🎉 YOU WON THE TOSS!";
        document.getElementById('toss-winner-text').style.color = 'var(--accent-neon)';
        playerDecisionBox.style.display = 'block';
    } else {
        document.getElementById('toss-winner-text').innerText = "🤖 COMPUTER WON THE TOSS!";
        document.getElementById('toss-winner-text').style.color = 'var(--accent-red)';
        
        gameState.isPlayerBatting = Math.random() < 0.5 ? false : true;
        const compChoice = gameState.isPlayerBatting ? 'BOWL' : 'BAT';
        gameState.commentaryHistory.push(`🤖 Computer elected to ${compChoice} first.`);

        let p = document.createElement('p');
        p.style.color = "var(--text-bright)";
        p.style.fontSize = "1.2rem";
        p.innerHTML = `Computer chooses to <b>${compChoice}</b> first.`;
        computerDecisionBox.prepend(p);
        computerDecisionBox.style.display = 'block';
    }
}

function startMatch(playerOptsToBat) {
    gameState.isPlayerBatting = playerOptsToBat;
    gameState.commentaryHistory.push(`👤 You elected to ${playerOptsToBat ? 'BAT' : 'BOWL'} first.`);
    continueToMatch();
}

function continueToMatch() {
    if (tossScreen) tossScreen.style.display = 'none';
    matchScreen.style.display = 'block';
    updateMatchUI();
    
    let formatText = gameState.maxBalls === Infinity ? "Classic (Unlimited Overs)" : `T${gameState.maxBalls/6} (${gameState.maxWickets} Wickets)`;
    gameState.commentaryHistory.push(`--- MATCH START | 1ST INNINGS | ${formatText} ---`);
    writeCommentary(gameState.isPlayerBatting ? "You are Batting first. Put up a massive total!" : "You are Bowling first. Take early wickets!");
}

function ballsToOvers(balls) {
    return Math.floor(balls / 6) + "." + (balls % 6);
}

function updateMatchUI() {
    if (gameState.innings === 1) {
        inningsStatus.innerText = "🏏 1ST INNINGS";
    } else {
        inningsStatus.innerText = "⚔️ 2ND INNINGS THE CHASE";
        targetBox.style.display = 'block';
        targetScoreUi.innerText = gameState.target;
    }
    
    const playerHandScore = document.getElementById('player-hand-score');
    if (playerHandScore) playerHandScore.innerText = gameState.playerStats.runs;
    
    const playerHandWickets = document.getElementById('player-hand-wickets');
    if (playerHandWickets) playerHandWickets.innerText = gameState.playerStats.wicketsLost;
    
    const playerOvers = document.getElementById('player-overs');
    if (playerOvers) playerOvers.innerText = ballsToOvers(gameState.playerStats.balls);
    
    const compHandScore = document.getElementById('computer-hand-score');
    if (compHandScore) compHandScore.innerText = gameState.compStats.runs;
    
    const compHandWickets = document.getElementById('computer-hand-wickets');
    if (compHandWickets) compHandWickets.innerText = gameState.compStats.wicketsLost;
    
    const compOvers = document.getElementById('computer-overs');
    if (compOvers) compOvers.innerText = ballsToOvers(gameState.compStats.balls);

    const maxOversText = gameState.maxBalls === Infinity ? " (Unlimited)" : ` / ${gameState.maxBalls/6}.0`;
    
    const playerMaxOvers = document.getElementById('player-max-overs');
    if (playerMaxOvers) playerMaxOvers.innerText = maxOversText;
    
    const compMaxOvers = document.getElementById('computer-max-overs');
    if (compMaxOvers) compMaxOvers.innerText = maxOversText;

    if (zeroBtn) {
        if (gameState.isPlayerBatting) {
            zeroBtn.innerHTML = "🛡️ 0 (DEFEND)";
            zeroBtn.style.background = "rgba(0, 210, 255, 0.1)";
            zeroBtn.style.borderColor = "var(--accent-blue)";
        } else {
            zeroBtn.innerHTML = "↔️ 0 (WIDE)";
            zeroBtn.style.background = "rgba(255, 42, 42, 0.1)";
            zeroBtn.style.borderColor = "var(--accent-red)";
        }
    }
}

// --- NEW ULTIMATE PRO AI ENGINE ---
function getComputerThrow() {
    let compNum;
    let isCompBatting = !gameState.isPlayerBatting;

    // AI is locked from defending 3 times
    if (gameState.compConsecZeros >= 2) return Math.floor(Math.random() * 6) + 1;
    
    // Casual Mode = Pure Random
    if (gameState.aiDifficulty === 'easy' || !currentUser) return Math.floor(Math.random() * 7);

    // Hard Mode: Career Pattern Analysis
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    let stats = usersDB[currentUser];
    
    if (!stats || !stats.battingThrows) return Math.floor(Math.random() * 7);

    if (!isCompBatting) {
        // AI is Bowling -> Look at what player historically BATS
        let pBats = stats.battingThrows;
        let likelyPlayerThrow = Object.keys(pBats).reduce((a, b) => pBats[a] > pBats[b] ? a : b);
        
        // 75% chance AI explicitly targets the player's favorite batting throw!
        if (Math.random() < 0.75) {
            compNum = parseInt(likelyPlayerThrow);
        } else {
            compNum = Math.floor(Math.random() * 7);
        }
    } else {
        // AI is Batting -> Look at what player historically BOWLS
        let pBowls = stats.bowlingThrows;
        let likelyPlayerThrow = Object.keys(pBowls).reduce((a, b) => pBowls[a] > pBowls[b] ? a : b);
        
        // AI specifically avoids the player's favorite bowling throw!
        compNum = Math.floor(Math.random() * 7);
        let attempts = 0;
        while (compNum === parseInt(likelyPlayerThrow) && attempts < 5) {
            compNum = Math.floor(Math.random() * 7);
            attempts++;
        }
    }
    
    return compNum;
}

// --- CORE GAMEPLAY LOGIC ---
function playHand(playerNum) {
    if (gameState.gameOver || gameState.isTransitioning) return;

    // Log the throw LIVE to Career Database
    if (currentUser) {
        let usersDB = JSON.parse(localStorage.getItem('hc_usersDB'));
        let stats = usersDB[currentUser];
        if (gameState.isPlayerBatting) {
            stats.battingThrows[playerNum] = (stats.battingThrows[playerNum] || 0) + 1;
        } else {
            stats.bowlingThrows[playerNum] = (stats.bowlingThrows[playerNum] || 0) + 1;
        }
        localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
    }

    const compNum = getComputerThrow();

    if (gameState.isPlayerBatting) {
        gameState.playerConsecZeros = (playerNum === 0) ? gameState.playerConsecZeros + 1 : 0;
    } else {
        gameState.compConsecZeros = (compNum === 0) ? gameState.compConsecZeros + 1 : 0;
    }

    if (navigator.vibrate) navigator.vibrate([50]);

    document.getElementById('player-hand').innerText = handEmojis[playerNum];
    document.getElementById('computer-hand').innerText = handEmojis[compNum];

    const batNum = gameState.isPlayerBatting ? playerNum : compNum;
    const bowlNum = gameState.isPlayerBatting ? compNum : playerNum;
    const currentBalls = (gameState.isPlayerBatting ? gameState.playerStats.balls : gameState.compStats.balls) + 1;
    gameState.commentaryHistory.push(`[Ball ${currentBalls}] Bowler threw ${bowlNum}, Batter threw ${batNum}`);

    if (gameState.isPlayerBatting && gameState.playerConsecZeros === 3) handleWicket(0, 'HIT_WICKET');
    else if (!gameState.isPlayerBatting && gameState.compConsecZeros === 3) handleWicket(0, 'HIT_WICKET');
    else if (playerNum === 0 && compNum === 0) handleWicket(0, 'STUMPED'); 
    else if (playerNum === compNum) handleWicket(playerNum, 'CAUGHT/BOWLED');
    else if ((gameState.isPlayerBatting && compNum === 0) || (!gameState.isPlayerBatting && playerNum === 0)) {
        // NEW WIDE RULE: Pass the Batter's Number!
        handleWide(batNum);
    }
    else if ((gameState.isPlayerBatting && playerNum === 0) || (!gameState.isPlayerBatting && compNum === 0)) handleDefense();
    else handleRuns(gameState.isPlayerBatting ? playerNum : compNum);

    if (!gameState.isTransitioning && !gameState.gameOver) {
        updateMatchUI();
        checkMatchState();
    }
}

function getRandomCommentary(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function handleWicket(num, type) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.balls++;
    currentBatterStats.wicketsLost++;
    const batterName = gameState.isPlayerBatting ? "You" : "Computer";
    
    currentBatterStats.outOn = (type === 'HIT_WICKET') ? '0 (Hit Wkt)' : (type === 'STUMPED' ? '0 (Stumped)' : num);
    
    if (type === 'STUMPED') writeCommentary(`🚨 WIDE AND STUMPED! Lightning-fast glovework removes ${batterName}!`);
    else if (type === 'HIT_WICKET') writeCommentary(`🏏💥 HIT WICKET! ${batterName} defended too deep (3x 0s) and stepped on the stumps! OUT!`);
    else writeCommentary(`💥 WICKET! Clean bowled! Both threw ${num}. ${batterName} departs!`);
}

// --- NEW WIDE RULE LOGIC ---
function handleWide(batterNum) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    const runsToAdd = batterNum + 1; // Batter's throw + 1 Extra
    
    currentBatterStats.runs += runsToAdd;
    currentBatterStats.extras += runsToAdd; 
    // Notice: We specifically DO NOT add to currentBatterStats.balls!

    const team = gameState.isPlayerBatting ? "You" : "Computer";
    writeCommentary(`↔️ WIDE BALL! Bowler threw 0. Batter threw ${batterNum}. +${runsToAdd} Runs to ${team}. (Ball not counted)`);

    if (gameState.innings === 2 && currentBatterStats.runs >= gameState.target) {
        endGame(gameState.isPlayerBatting ? "PLAYER_WINS" : "COM_WINS");
    }
}

function handleDefense() {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.balls++;
    writeCommentary(`🛡️ SOLID DEFENSE! Batter blocked the ball safely. 0 runs.`);
}

function handleRuns(runs) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.runs += runs;
    currentBatterStats.balls++;
    
    if (runs === 4) currentBatterStats.fours++;
    if (runs === 6) currentBatterStats.sixes++;

    if (runs === 4) writeCommentary(`🔥 +4 Runs! Glorious cover drive to the boundary!`);
    else if (runs === 6) writeCommentary(`🚀 +6 Runs! MASSIVE HIT! Out of the stadium!`);
    else writeCommentary(`🏃 +${runs} Runs! Quick running between the wickets.`);
}

function checkMatchState() {
    const stats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    
    const isAllOut = stats.wicketsLost >= gameState.maxWickets;
    const isOversDone = stats.balls >= gameState.maxBalls;
    const isTargetReached = gameState.innings === 2 && stats.runs >= gameState.target;

    if (isTargetReached) {
        endGame(gameState.isPlayerBatting ? "PLAYER_WINS" : "COM_WINS");
        return;
    }

    if (isAllOut || isOversDone) {
        const reason = isAllOut ? "ALL OUT" : "OVERS COMPLETED";
        
        if (gameState.innings === 1) {
            triggerInningsChange(stats, reason);
        } else {
            if (stats.runs < gameState.target - 1) endGame(gameState.isPlayerBatting ? "COM_WINS" : "PLAYER_WINS");
            else if (stats.runs === gameState.target - 1) endGame("TIE");
        }
    }
}

function triggerInningsChange(currentBatterStats, reason) {
    gameState.innings = 2;
    gameState.target = currentBatterStats.runs + 1;
    gameState.isPlayerBatting = !gameState.isPlayerBatting;
    
    gameState.playerConsecZeros = 0;
    gameState.compConsecZeros = 0;
    gameState.isTransitioning = true; 
    
    setTimeout(() => {
        const breakMsg = `${reason}! Innings Break! Target is ${gameState.target}. ${gameState.isPlayerBatting ? "Time to chase!" : "Defend this total!"}`;
        gameState.commentaryHistory.push(`\n--- INNINGS BREAK (${reason}) ---`);
        gameState.commentaryHistory.push(`--- MATCH START | 2ND INNINGS THE CHASE ---`);
        writeCommentary(breakMsg);

        document.getElementById('player-hand').innerText = '✊';
        document.getElementById('computer-hand').innerText = '✊';
        gameState.isTransitioning = false; 
        updateMatchUI(); 
    }, 2500);
}

function writeCommentary(text) {
    gameState.commentaryHistory.push(`↳ ${text}`);
    commentaryBox.innerHTML = `> ${text}`;
    commentaryBox.style.transform = 'scale(1.02)';
    setTimeout(() => { commentaryBox.style.transform = 'scale(1)'; }, 200);
}

function endGame(result) {
    gameState.gameOver = true;
    actionArea.style.display = 'none';
    document.getElementById('end-game-controls').style.display = 'flex';
    
    if (result === "PLAYER_WINS") {
        inningsStatus.innerText = "🏆 YOU WON THE MATCH!";
        inningsStatus.style.background = "var(--accent-blue)";
    } else if (result === "COM_WINS") {
        inningsStatus.innerText = "💀 COMPUTER WON!";
        inningsStatus.style.background = "var(--accent-red)";
    } else {
        inningsStatus.innerText = "🤝 IT'S A TIE!";
        inningsStatus.style.background = "gray";
    }

    gameState.commentaryHistory.push(`\n--- MATCH ENDED | ${inningsStatus.innerText} ---`);

    populateStats('an-p', gameState.playerStats, gameState.compStats);
    populateStats('an-c', gameState.compStats, gameState.playerStats);
    generateAIInsight(result);
    saveLifetimeStats(result);
}

function saveLifetimeStats(result) {
    if (!currentUser) return;
    
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    let stats = usersDB[currentUser];
    
    stats.matches += 1;
    if (result === "PLAYER_WINS") stats.wins += 1;
    else if (result === "COM_WINS") stats.losses += 1;
    else stats.ties += 1;
    
    stats.totalRuns += gameState.playerStats.runs;
    stats.totalBallsFaced += gameState.playerStats.balls;
    if (gameState.playerStats.runs > stats.highestScore) stats.highestScore = gameState.playerStats.runs;
    
    stats.totalDismissals = (stats.totalDismissals || 0) + gameState.playerStats.wicketsLost;
    if (gameState.playerStats.runs === 0 && gameState.playerStats.wicketsLost > 0) stats.ducks += 1;
    
    stats.totalRunsConceded += gameState.compStats.runs;
    stats.totalBallsBowled += gameState.compStats.balls;
    
    if (gameState.compStats.wicketsLost > 0) {
        stats.totalWicketsTaken += gameState.compStats.wicketsLost;
        if (stats.bestSpellRuns === null || gameState.compStats.runs < stats.bestSpellRuns) {
            stats.bestSpellRuns = gameState.compStats.runs;
        }
    }
    
    usersDB[currentUser] = stats;
    localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
}

function populateStats(prefix, batterStats, bowlerStats) {
    const rElement = document.getElementById(`${prefix}-runs`);
    if(rElement) rElement.innerText = batterStats.runs;
    
    const wElement = document.getElementById(`${prefix}-wickets`);
    if(wElement) wElement.innerText = batterStats.wicketsLost;
    
    const bElement = document.getElementById(`${prefix}-balls`);
    if(bElement) bElement.innerText = batterStats.balls;
    
    const srElement = document.getElementById(`${prefix}-sr`);
    if(srElement) srElement.innerText = batterStats.balls > 0 ? ((batterStats.runs / batterStats.balls) * 100).toFixed(2) : "0.00";
    
    const rrElement = document.getElementById(`${prefix}-rr`);
    if(rrElement) rrElement.innerText = batterStats.balls > 0 ? ((batterStats.runs / (batterStats.balls/6))).toFixed(2) : "0.00";
    
    const boundsElement = document.getElementById(`${prefix}-bounds`);
    if(boundsElement) boundsElement.innerText = batterStats.fours + batterStats.sixes;
    
    const foursElement = document.getElementById(`${prefix}-4s`);
    if(foursElement) foursElement.innerText = batterStats.fours;
    
    const sixesElement = document.getElementById(`${prefix}-6s`);
    if(sixesElement) sixesElement.innerText = batterStats.sixes;
    
    const outElement = document.getElementById(`${prefix}-out`);
    if(outElement) outElement.innerText = batterStats.outOn; 
    
    const extrasElement = document.getElementById(`${prefix}-extras`);
    if(extrasElement) extrasElement.innerText = batterStats.extras;
    
    const oversBowled = bowlerStats.balls / 6;
    const ecoElement = document.getElementById(`${prefix}-eco`);
    if(ecoElement) ecoElement.innerText = oversBowled > 0 ? (bowlerStats.runs / oversBowled).toFixed(2) : "0.00";
}

function generateAIInsight(result) {
    const insightBox = document.getElementById('ai-insight-text');
    if (!insightBox) return;
    if (gameState.aiDifficulty === 'hard') {
        insightBox.innerText = "Pro AI Engine Active: The computer analyzed your entire career throw history to predict your moves. Keep randomizing your patterns to break the algorithm!";
    } else {
        insightBox.innerText = "Casual Match Completed. Try increasing the AI difficulty to 'Pro' to see how well the computer can read your mind!";
    }
}

function resetToToss() { location.reload(); }
function openAnalysis() { document.getElementById('analysis-modal').style.display = 'flex'; }
function closeAnalysis() { document.getElementById('analysis-modal').style.display = 'none'; }

// --- TABLE-BASED PDF GENERATOR (FIXES TEXT SPLITTING) ---
function downloadPDF() {
    const btn = document.getElementById('pdf-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ GENERATING REPORT...";
    btn.disabled = true;

    const printElement = document.createElement('div');
    
    let pdfHTML = `
        <div style="font-family: Arial, sans-serif; color: #000000; padding: 20px; background: #ffffff; font-size: 15px; line-height: 1.5;">
            <div style="text-align: center; border-bottom: 4px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="font-size: 32px; font-weight: 900; color: #000000; margin: 0;">HAND CLASH</h1>
                <h2 style="font-size: 18px; font-weight: 800; color: #000000; margin: 5px 0 0 0;">OFFICIAL MATCH REPORT</h2>
            </div>
            
            <div style="text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 30px; border-left: 8px solid #3b82f6; border: 2px solid #000000;">
                <h3 style="margin: 0; font-size: 20px; color: #000000; font-weight: 900;">${document.getElementById('innings-status').innerText.replace(/[🏏⚔️]/g, '').trim()}</h3>
            </div>

            <table style="width: 100%; border-collapse: separate; border-spacing: 20px 0; margin-bottom: 30px;">
                <tr>
                    <td style="width: 50%; vertical-align: top; background: #ffffff; border: 2px solid #000000; border-top: 8px solid #3b82f6; border-radius: 8px; padding: 20px;">
                        <h3 style="margin-top: 0; color: #000000; font-size: 18px; border-bottom: 2px solid #000000; padding-bottom: 10px; font-weight: 900;">YOUR PERFORMANCE</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #000000; font-weight: 700;">
                            <tr><td style="padding: 8px 0;">Runs Scored</td><td style="text-align: right; font-weight: 900; font-size: 18px;">${gameState.playerStats.runs} <span style="font-size:13px; font-weight:bold;">(${gameState.playerStats.balls} balls)</span></td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Wickets Lost</td><td style="text-align: right; font-weight: 900; color:#dc2626;">${gameState.playerStats.wicketsLost}</td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Strike Rate</td><td style="text-align: right; font-weight: 900;">${document.getElementById('an-p-sr').innerText}</td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Boundaries</td><td style="text-align: right; font-weight: 900;">${document.getElementById('an-p-bounds').innerText} <span style="font-size:13px; font-weight:bold;">(4s: ${gameState.playerStats.fours} | 6s: ${gameState.playerStats.sixes})</span></td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Bowling Eco.</td><td style="text-align: right; font-weight: 900;">${document.getElementById('an-p-eco').innerText}</td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Extras Rcvd.</td><td style="text-align: right; font-weight: 900;">${gameState.playerStats.extras}</td></tr>
                        </table>
                    </td>
                    <td style="width: 50%; vertical-align: top; background: #ffffff; border: 2px solid #000000; border-top: 8px solid #ef4444; border-radius: 8px; padding: 20px;">
                        <h3 style="margin-top: 0; color: #000000; font-size: 18px; border-bottom: 2px solid #000000; padding-bottom: 10px; font-weight: 900;">COM PERFORMANCE</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #000000; font-weight: 700;">
                            <tr><td style="padding: 8px 0;">Runs Scored</td><td style="text-align: right; font-weight: 900; font-size: 18px;">${gameState.compStats.runs} <span style="font-size:13px; font-weight:bold;">(${gameState.compStats.balls} balls)</span></td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Wickets Lost</td><td style="text-align: right; font-weight: 900; color:#dc2626;">${gameState.compStats.wicketsLost}</td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Strike Rate</td><td style="text-align: right; font-weight: 900;">${document.getElementById('an-c-sr').innerText}</td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Boundaries</td><td style="text-align: right; font-weight: 900;">${document.getElementById('an-c-bounds').innerText} <span style="font-size:13px; font-weight:bold;">(4s: ${gameState.compStats.fours} | 6s: ${gameState.compStats.sixes})</span></td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Bowling Eco.</td><td style="text-align: right; font-weight: 900;">${document.getElementById('an-c-eco').innerText}</td></tr>
                            <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Extras Rcvd.</td><td style="text-align: right; font-weight: 900;">${gameState.compStats.extras}</td></tr>
                        </table>
                    </td>
                </tr>
            </table>

            <h3 style="color: #000000; font-size: 20px; font-weight: 900; border-bottom: 4px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">BALL-BY-BALL MATCH LOG</h3>
            
            <table style="width: 100%; border-collapse: collapse; font-family: 'Courier New', Courier, monospace; font-size: 15px; line-height: 1.6; color: #000000; page-break-inside: auto;">
                <tbody>
    `;

    let currentGroup = '';
    gameState.commentaryHistory.forEach(log => {
        let safeText = log.replace(/[🪙🤖👤💥🏏🎯🧤😱↔️🙅‍♂️😬🎁🛡️🧱🛑👀🔥⚡🤌🚀🛸🤯🏃🏃‍♂️🚨🤦‍♂️😲🪵]/g, '').trim();
        safeText = safeText.replace('↳', '>').trim();
        
        let lineStyle = "margin: 4px 0; color: #000000; font-weight: 700;";
        if(safeText.includes("WICKET") || safeText.includes("STUMPED") || safeText.includes("HOWZAT") || safeText.includes("HIT WICKET")) {
            lineStyle = "margin: 4px 0; color: #b91c1c; font-weight: 900;";
        } else if (safeText.includes("+4") || safeText.includes("+6")) {
            lineStyle = "margin: 4px 0; color: #1d4ed8; font-weight: 900;";
        } else if (safeText.includes("---")) {
            lineStyle = "margin: 15px 0 5px 0; padding: 10px; background: #e5e7eb; border: 3px solid #000000; text-align: center; font-weight: 900; font-size: 16px;";
        }

        // Bundle each ball sequence into table rows (<tr>)
        if (safeText.startsWith('[Ball') || safeText.startsWith('---') || safeText.includes('TOSS') || safeText.includes('elected to')) {
            if (currentGroup !== '') {
                pdfHTML += `<tr style="page-break-inside: avoid; page-break-after: auto;">
                                <td style="border-left: 4px solid #000000; padding-left: 15px; padding-bottom: 15px; border-bottom: 1px dashed #d1d5db;">${currentGroup}</td>
                            </tr>`;
            }
            currentGroup = `<div style="${lineStyle}">${safeText}</div>`;
        } else {
            currentGroup += `<div style="${lineStyle}">${safeText}</div>`;
        }
    });
    
    // Add final group
    if (currentGroup !== '') {
        pdfHTML += `<tr style="page-break-inside: avoid; page-break-after: auto;">
                        <td style="border-left: 4px solid #000000; padding-left: 15px; padding-bottom: 15px; border-bottom: 1px dashed #d1d5db;">${currentGroup}</td>
                    </tr>`;
    }

    pdfHTML += `
                </tbody>
            </table>
            <div style="margin-top: 50px; text-align: center; color: #000000; font-size: 14px; font-weight: 900; border-top: 3px solid #000000; padding-top: 20px;">
                Generated by Hand Clash Arena &bull; &copy; 2026
            </div>
        </div>`;

    printElement.innerHTML = pdfHTML;

    const opt = {
        margin: 0.4, 
        filename: 'Hand_Clash_Match_Report.pdf', 
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printElement).save().then(() => {
        btn.innerHTML = originalText; 
        btn.disabled = false;
    });
}
