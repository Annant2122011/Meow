/* =========================================================
   CRICPULSE FUN-GUN ARENA | GAME LOGIC (WITH HIT WICKET)
   ========================================================= */

// Game State Object
let gameState = {
    tossChoice: null,
    isPlayerBatting: null,
    innings: 1,
    target: null,
    gameOver: false,
    isTransitioning: false, 
    
    // Tracking consecutive defensive plays
    playerConsecZeros: 0,
    compConsecZeros: 0,
    
    // Stats
    playerStats: { runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0 },
    compStats:   { runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0 }
};

// Hand Number to Emoji Map
const handEmojis = { 0: '🛡️', 1: '☝️', 2: '✌️', 3: '🤟', 4: '🖖', 5: '🖐️', 6: '🤙' };

// DOM Elements
const tossStep1 = document.getElementById('toss-step-1');
const tossStep2 = document.getElementById('toss-step-2');
const tossChoiceText = document.getElementById('toss-choice-text');
const tossResultScreen = document.getElementById('toss-result-screen');
const playerDecisionBox = document.getElementById('player-decision-box');
const computerDecisionBox = document.getElementById('computer-decision-box');

const matchScreen = document.getElementById('match-screen');
const tossScreen = document.getElementById('toss-screen');
const inningsStatus = document.getElementById('innings-status');
const commentaryBox = document.getElementById('hand-commentary');
const playerHandScoreUi = document.getElementById('player-hand-score');
const computerHandScoreUi = document.getElementById('computer-hand-score');
const targetBox = document.getElementById('target-box');
const targetScoreUi = document.getElementById('target-score');
const actionArea = document.getElementById('hand-action-area');

// --- TOSS LOGIC ---
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
    
    if (playerWins) {
        document.getElementById('toss-winner-text').innerText = "🎉 YOU WON THE TOSS!";
        document.getElementById('toss-winner-text').style.color = 'var(--accent-neon)';
        playerDecisionBox.style.display = 'block';
    } else {
        document.getElementById('toss-winner-text').innerText = "🤖 COMPUTER WON THE TOSS!";
        document.getElementById('toss-winner-text').style.color = 'var(--accent-red)';
        
        gameState.isPlayerBatting = Math.random() < 0.5 ? false : true;
        const compChoice = gameState.isPlayerBatting ? 'BOWL' : 'BAT';
        
        let p = document.createElement('p');
        p.style.color = "var(--text-bright)";
        p.style.fontSize = "1.2rem";
        p.innerHTML = `Computer chooses to <b>${compChoice}</b> first.`;
        computerDecisionBox.prepend(p);
        
        computerDecisionBox.style.display = 'block';
    }
}

// --- MATCH SETUP ---
function startMatch(playerOptsToBat) {
    gameState.isPlayerBatting = playerOptsToBat;
    continueToMatch();
}

function continueToMatch() {
    tossScreen.style.display = 'none';
    matchScreen.style.display = 'block';
    updateMatchUI();
    writeCommentary(gameState.isPlayerBatting ? "You are Batting first. Put up a massive total!" : "You are Bowling first. Take early wickets!");
}

function updateMatchUI() {
    if (gameState.innings === 1) {
        inningsStatus.innerText = "🏏 1ST INNINGS";
    } else {
        inningsStatus.innerText = "⚔️ 2ND INNINGS THE CHASE";
        targetBox.style.display = 'block';
        targetScoreUi.innerText = gameState.target;
    }
    
    playerHandScoreUi.innerText = gameState.playerStats.runs;
    computerHandScoreUi.innerText = gameState.compStats.runs;
}

// --- CORE GAMEPLAY LOGIC ---
function playHand(playerNum) {
    if (gameState.gameOver || gameState.isTransitioning) return;

    // Generate Computer Number
    let compNum;
    if (!gameState.isPlayerBatting) { // Computer is Batting
        if (gameState.compConsecZeros >= 2) {
            // AI is smart but has a 10% chance to make a mistake and get Hit Wicket!
            compNum = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 6) + 1; 
        } else {
            compNum = Math.floor(Math.random() * 7); // 0-6
        }
    } else { // Computer is Bowling (can throw 0 infinitely)
        compNum = Math.floor(Math.random() * 7); // 0-6
    }

    // Track Consecutive Zeros
    if (gameState.isPlayerBatting) {
        gameState.playerConsecZeros = (playerNum === 0) ? gameState.playerConsecZeros + 1 : 0;
    } else {
        gameState.compConsecZeros = (compNum === 0) ? gameState.compConsecZeros + 1 : 0;
    }

    // Mobile Vibrate Feedback
    if (navigator.vibrate) navigator.vibrate([50]);

    document.getElementById('player-hand').innerText = handEmojis[playerNum];
    document.getElementById('computer-hand').innerText = handEmojis[compNum];

    // SCENARIO 0: HIT WICKET (3 consecutive zeros by Batter)
    if (gameState.isPlayerBatting && gameState.playerConsecZeros === 3) {
        handleWicket(0, 'HIT_WICKET');
    }
    else if (!gameState.isPlayerBatting && gameState.compConsecZeros === 3) {
        handleWicket(0, 'HIT_WICKET');
    }
    // SCENARIO 1: Both throw 0 (LBW Wicket)
    else if (playerNum === 0 && compNum === 0) {
        handleWicket(0, 'LBW');
    }
    // SCENARIO 2: Normal Wicket
    else if (playerNum === compNum) {
        handleWicket(playerNum, 'CAUGHT/BOWLED');
    }
    // SCENARIO 3: Bowler throws 0 (WIDE)
    else if ((gameState.isPlayerBatting && compNum === 0) || (!gameState.isPlayerBatting && playerNum === 0)) {
        handleWide();
    }
    // SCENARIO 4: Batter throws 0 (DEFENSE)
    else if ((gameState.isPlayerBatting && playerNum === 0) || (!gameState.isPlayerBatting && compNum === 0)) {
        handleDefense();
    }
    // SCENARIO 5: Normal Runs
    else {
        handleRuns(gameState.isPlayerBatting ? playerNum : compNum);
    }

    if (!gameState.isTransitioning) {
        updateMatchUI();
    }
}

function handleWicket(num, type) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.balls++;
    
    // Update the stats sheet to show how they got out
    currentBatterStats.outOn = (type === 'HIT_WICKET') ? '0 (Hit Wkt)' : (type === 'LBW' ? '0 (LBW)' : num);
    
    // Play-by-Play Commentary
    if (type === 'LBW') {
        writeCommentary(`🚨 HOWZAT?! Both threw 🛡️. ${gameState.isPlayerBatting ? "You are" : "Computer is"} OUT LBW! Plumb in front!`);
    } else if (type === 'HIT_WICKET') {
        writeCommentary(`🏏💥 HIT WICKET! ${gameState.isPlayerBatting ? "You" : "Computer"} defended too deep (3 consecutive 0s) and stepped on the stumps! OUT!`);
    } else {
        writeCommentary(`💥 WICKET! Both threw ${num}. ${gameState.isPlayerBatting ? "You are" : "Computer is"} OUT!`);
    }
    
    // Switch Innings or End Match
    if (gameState.innings === 1) {
        gameState.innings = 2;
        gameState.target = currentBatterStats.runs + 1;
        gameState.isPlayerBatting = !gameState.isPlayerBatting;
        
        // Reset zero trackers for the new innings
        gameState.playerConsecZeros = 0;
        gameState.compConsecZeros = 0;
        
        gameState.isTransitioning = true; 
        
        setTimeout(() => {
            writeCommentary(`Innings Break! Target is ${gameState.target}. ${gameState.isPlayerBatting ? "Time to chase!" : "Defend this total!"}`);
            document.getElementById('player-hand').innerText = '✊';
            document.getElementById('computer-hand').innerText = '✊';
            gameState.isTransitioning = false; 
            updateMatchUI(); 
        }, 2000);
    } else {
        const battingSecondStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
        if (battingSecondStats.runs < gameState.target - 1) {
            endGame(gameState.isPlayerBatting ? "COM_WINS" : "PLAYER_WINS");
        } else if (battingSecondStats.runs === gameState.target - 1) {
            endGame("TIE");
        }
    }
}

function handleWide() {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    
    currentBatterStats.runs += 1;
    currentBatterStats.extras += 1;
    
    writeCommentary(`↔️ WIDE BALL! Bowler threw 🛡️. +1 Extra Run to ${gameState.isPlayerBatting ? "You" : "Computer"}.`);

    if (gameState.innings === 2 && currentBatterStats.runs >= gameState.target) {
        endGame(gameState.isPlayerBatting ? "PLAYER_WINS" : "COM_WINS");
    }
}

function handleDefense() {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    
    currentBatterStats.balls++;
    writeCommentary(`🛡️ SOLID DEFENSE! Batter blocked the ball. No runs scored.`);
}

function handleRuns(runs) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    
    currentBatterStats.runs += runs;
    currentBatterStats.balls++;
    
    if (runs === 4) currentBatterStats.fours++;
    if (runs === 6) currentBatterStats.sixes++;

    let msg = `+${runs} Runs! `;
    if (runs === 4) msg += "Glorious boundary! 🔥";
    if (runs === 6) msg += "Massive SIX! Out of the park! 🚀";
    writeCommentary(msg);

    if (gameState.innings === 2 && currentBatterStats.runs >= gameState.target) {
        endGame(gameState.isPlayerBatting ? "PLAYER_WINS" : "COM_WINS");
    }
}

function writeCommentary(text) {
    commentaryBox.innerHTML = `> ${text}`;
    commentaryBox.style.transform = 'scale(1.02)';
    setTimeout(() => { commentaryBox.style.transform = 'scale(1)'; }, 200);
}

// --- POST MATCH ANALYSIS ---
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

    populateStats('an-p', gameState.playerStats, gameState.compStats);
    populateStats('an-c', gameState.compStats, gameState.playerStats);
    generateAIInsight(result);
}

function populateStats(prefix, batterStats, bowlerStats) {
    document.getElementById(`${prefix}-runs`).innerText = batterStats.runs;
    document.getElementById(`${prefix}-balls`).innerText = batterStats.balls;
    document.getElementById(`${prefix}-sr`).innerText = batterStats.balls > 0 ? ((batterStats.runs / batterStats.balls) * 100).toFixed(2) : "0.00";
    document.getElementById(`${prefix}-rr`).innerText = batterStats.balls > 0 ? ((batterStats.runs / (batterStats.balls/6))).toFixed(2) : "0.00";
    document.getElementById(`${prefix}-bounds`).innerText = batterStats.fours + batterStats.sixes;
    document.getElementById(`${prefix}-4s`).innerText = batterStats.fours;
    document.getElementById(`${prefix}-6s`).innerText = batterStats.sixes;
    
    // Shows standard numbers, or "0 (Hit Wkt)" / "0 (LBW)"
    document.getElementById(`${prefix}-out`).innerText = batterStats.outOn; 
    
    document.getElementById(`${prefix}-extras`).innerText = batterStats.extras;
    
    const oversBowled = bowlerStats.balls / 6;
    const economy = oversBowled > 0 ? (bowlerStats.runs / oversBowled).toFixed(2) : "0.00";
    document.getElementById(`${prefix}-eco`).innerText = economy;
}

function generateAIInsight(result) {
    const insightBox = document.getElementById('ai-insight-text');
    const pSR = gameState.playerStats.balls > 0 ? (gameState.playerStats.runs / gameState.playerStats.balls) * 100 : 0;
    
    if (result === "PLAYER_WINS") {
        if (pSR > 200) insightBox.innerText = "Incredible aggression! You dismantled the AI with sheer boundary-hitting power. A true T20 masterclass.";
        else insightBox.innerText = "A well-calculated victory. You utilized the defense mechanic perfectly and kept your nerve under pressure.";
    } else if (result === "COM_WINS") {
        insightBox.innerText = "The AI read your patterns like a book. Watch out for those LBWs and try to randomize your throws more next time!";
    } else {
        insightBox.innerText = "A thriller that goes down to the wire! Nothing separates human and machine today.";
    }
}

function resetToToss() {
    location.reload(); 
}

// Modal View Controllers
function openAnalysis() {
    document.getElementById('analysis-modal').style.display = 'flex';
}

function closeAnalysis() {
    document.getElementById('analysis-modal').style.display = 'none';
}
