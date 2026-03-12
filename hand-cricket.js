/* =========================================================
   CRICPULSE FUN-GUN ARENA | GAME LOGIC
   ========================================================= */

// Game State Object
let gameState = {
    tossChoice: null,
    isPlayerBatting: null,
    innings: 1,
    target: null,
    gameOver: false,
    isTransitioning: false, // Prevents clicks during innings break
    
    playerStats: { runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-' },
    compStats:   { runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-' }
};

// Hand Number to Emoji Map
const handEmojis = { 1: '☝️', 2: '✌️', 3: '🤟', 4: '🖖', 5: '🖐️', 6: '🤙' };

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

    // Mobile Vibrate Feedback (50ms)
    if (navigator.vibrate) {
        navigator.vibrate([50]);
    }

    const compNum = Math.floor(Math.random() * 6) + 1;
    
    document.getElementById('player-hand').innerText = handEmojis[playerNum];
    document.getElementById('computer-hand').innerText = handEmojis[compNum];
    
    if (playerNum === compNum) {
        handleWicket(playerNum);
    } else {
        handleRuns(gameState.isPlayerBatting ? playerNum : compNum);
    }
    
    if (!gameState.isTransitioning) {
        updateMatchUI();
    }
}

function handleWicket(num) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.balls++;
    currentBatterStats.outOn = num;
    
    writeCommentary(`💥 WICKET! Both threw ${num}. ${gameState.isPlayerBatting ? "You are" : "Computer is"} OUT!`);
    
    if (gameState.innings === 1) {
        gameState.innings = 2;
        gameState.target = currentBatterStats.runs + 1;
        gameState.isPlayerBatting = !gameState.isPlayerBatting;
        
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
    
    // Show the new End Game Button Container
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

    populateStats('an-p', gameState.playerStats);
    populateStats('an-c', gameState.compStats);
    generateAIInsight(result);
}

function populateStats(prefix, stats) {
    document.getElementById(`${prefix}-runs`).innerText = stats.runs;
    document.getElementById(`${prefix}-balls`).innerText = stats.balls;
    document.getElementById(`${prefix}-sr`).innerText = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : "0.00";
    document.getElementById(`${prefix}-rr`).innerText = stats.balls > 0 ? ((stats.runs / (stats.balls/6))).toFixed(2) : "0.00";
    document.getElementById(`${prefix}-bounds`).innerText = stats.fours + stats.sixes;
    document.getElementById(`${prefix}-4s`).innerText = stats.fours;
    document.getElementById(`${prefix}-6s`).innerText = stats.sixes;
    document.getElementById(`${prefix}-out`).innerText = stats.outOn;
}

function generateAIInsight(result) {
    const insightBox = document.getElementById('ai-insight-text');
    const pSR = gameState.playerStats.balls > 0 ? (gameState.playerStats.runs / gameState.playerStats.balls) * 100 : 0;
    
    if (result === "PLAYER_WINS") {
        if (pSR > 200) insightBox.innerText = "Incredible aggression! You dismantled the AI with sheer boundary-hitting power. A true T20 masterclass.";
        else insightBox.innerText = "A well-calculated victory. You played the numbers perfectly and kept your nerve under pressure.";
    } else if (result === "COM_WINS") {
        insightBox.innerText = "The AI read your patterns like a book. Try to randomize your throws more next time to become unpredictable!";
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
