/* =========================================================
   CRICPULSE FUN-GUN ARENA | DYNAMIC GAME LOGIC & COMMENTARY
   ========================================================= */

// Game State Object
let gameState = {
    tossChoice: null,
    isPlayerBatting: null,
    innings: 1,
    target: null,
    gameOver: false,
    isTransitioning: false, 
    playerConsecZeros: 0,
    compConsecZeros: 0,
    playerStats: { runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0 },
    compStats:   { runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0 }
};

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
const zeroBtn = document.getElementById('zero-btn'); // New Dynamic Button

// Utility: Random Commentary Picker
function getRandomCommentary(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

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

    // --- DYNAMICALLY UPDATE THE '0' BUTTON TEXT AND COLOR ---
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

// --- CORE GAMEPLAY LOGIC ---
function playHand(playerNum) {
    if (gameState.gameOver || gameState.isTransitioning) return;

    let compNum;
    if (!gameState.isPlayerBatting) { 
        if (gameState.compConsecZeros >= 2) {
            compNum = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 6) + 1; 
        } else {
            compNum = Math.floor(Math.random() * 7); 
        }
    } else { 
        compNum = Math.floor(Math.random() * 7); 
    }

    if (gameState.isPlayerBatting) {
        gameState.playerConsecZeros = (playerNum === 0) ? gameState.playerConsecZeros + 1 : 0;
    } else {
        gameState.compConsecZeros = (compNum === 0) ? gameState.compConsecZeros + 1 : 0;
    }

    if (navigator.vibrate) navigator.vibrate([50]);

    document.getElementById('player-hand').innerText = handEmojis[playerNum];
    document.getElementById('computer-hand').innerText = handEmojis[compNum];

    // Check Logic
    if (gameState.isPlayerBatting && gameState.playerConsecZeros === 3) {
        handleWicket(0, 'HIT_WICKET');
    }
    else if (!gameState.isPlayerBatting && gameState.compConsecZeros === 3) {
        handleWicket(0, 'HIT_WICKET');
    }
    else if (playerNum === 0 && compNum === 0) {
        handleWicket(0, 'STUMPED'); // Changed from LBW to Stumped!
    }
    else if (playerNum === compNum) {
        handleWicket(playerNum, 'CAUGHT/BOWLED');
    }
    else if ((gameState.isPlayerBatting && compNum === 0) || (!gameState.isPlayerBatting && playerNum === 0)) {
        handleWide();
    }
    else if ((gameState.isPlayerBatting && playerNum === 0) || (!gameState.isPlayerBatting && compNum === 0)) {
        handleDefense();
    }
    else {
        handleRuns(gameState.isPlayerBatting ? playerNum : compNum);
    }

    if (!gameState.isTransitioning) {
        updateMatchUI();
    }
}

// --- ACTION HANDLERS WITH DYNAMIC COMMENTARY ---
function handleWicket(num, type) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.balls++;
    const batterName = gameState.isPlayerBatting ? "You" : "Computer";
    
    currentBatterStats.outOn = (type === 'HIT_WICKET') ? '0 (Hit Wkt)' : (type === 'STUMPED' ? '0 (Stumped)' : num);
    
    // Dynamic Wicket Commentary
    if (type === 'STUMPED') {
        const comments = [
            `🚨 WIDE AND STUMPED! Both threw 🛡️ (0). Lightning-fast glovework removes ${batterName}!`,
            `🧤 Beaten by the flight! Both threw 0. The keeper whips the bails off in a flash. STUMPED!`,
            `⚡ Oh, what a stumping! Both threw 0. Dragged wide and ${batterName} dragged their foot out. OUT!`,
            `🏏 Stepped out for a wild swing on a wide! Both threw 0. ${batterName} is stumped by a mile!`,
            `😱 Bowled wide, batter loses balance, and the keeper does the rest! Both threw 0. OUT!`
        ];
        writeCommentary(getRandomCommentary(comments));
    } else if (type === 'HIT_WICKET') {
        const comments = [
            `🏏💥 HIT WICKET! ${batterName} defended too deep (3x 0s) and stepped on the stumps! OUT!`,
            `🤦‍♂️ What a disaster! ${batterName} played back too far and dislodged the bails. Hit Wicket!`,
            `😲 Unbelievable! ${batterName} crushes their own stumps after defending endlessly!`,
            `🪵 Oh dear... A clumsy foot movement brings ${batterName}'s downfall. Hit Wicket!`,
            `🛑 That's a tragic way to go! Stepped on the stumps while trying to defend again.`
        ];
        writeCommentary(getRandomCommentary(comments));
    } else {
        const comments = [
            `💥 WICKET! Clean bowled! Both threw ${num}. ${batterName} has to walk back!`,
            `🏏 Edged and taken! Both threw ${num}. What a spectacular catch to dismiss ${batterName}!`,
            `🎯 Bullseye! The stumps are absolutely shattered! Both threw ${num}.`,
            `🧤 Caught in the deep! Absolute blinder of a catch to send ${batterName} packing. Both threw ${num}.`,
            `😱 What a delivery! Bamboozled completely. Both threw ${num}. OUT!`
        ];
        writeCommentary(getRandomCommentary(comments));
    }
    
    triggerInningsChange(currentBatterStats);
}

function handleWide() {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.runs += 1;
    currentBatterStats.extras += 1;
    const team = gameState.isPlayerBatting ? "You" : "Computer";
    
    // Dynamic Wide Commentary
    const comments = [
        `↔️ WIDE BALL! Bowler threw 0. Slipped out of the hand. +1 Extra to ${team}.`,
        `🙅‍♂️ Umpire stretches the arms! Bowler threw 0. Free run added for ${team}.`,
        `🏏 Way down the leg side! Bowler threw 0. That's a Wide. +1 Extra.`,
        `😬 Poor line from the bowler! Threw 0. Umpire calls it WIDE.`,
        `🎁 A complete gift for ${team}! Bowler threw 0. Wide called. +1 Run.`
    ];
    
    writeCommentary(getRandomCommentary(comments));

    if (gameState.innings === 2 && currentBatterStats.runs >= gameState.target) {
        endGame(gameState.isPlayerBatting ? "PLAYER_WINS" : "COM_WINS");
    }
}

function handleDefense() {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.balls++;
    
    // Dynamic Defense Commentary
    const comments = [
        `🛡️ SOLID DEFENSE! Batter blocked the ball safely. 0 runs.`,
        `🧱 Like a wall! Batter throws 0 and defends perfectly.`,
        `🏏 Played with a straight bat. Safe forward defense. No runs.`,
        `🛑 Respects the good delivery. Drops it onto the pitch. 0 runs.`,
        `👀 Left alone outside off stump! Well judged by the batter.`
    ];
    
    writeCommentary(getRandomCommentary(comments));
}

function handleRuns(runs) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.runs += runs;
    currentBatterStats.balls++;
    
    if (runs === 4) currentBatterStats.fours++;
    if (runs === 6) currentBatterStats.sixes++;

    // Dynamic Run Commentary
    let comments = [];
    if (runs === 4) {
        comments = [
            `🔥 +4 Runs! Glorious cover drive to the boundary!`,
            `🏏 +4 Runs! Pulled away beautifully into the gap!`,
            `⚡ +4 Runs! Pierced the infield like a tracer bullet!`,
            `💥 +4 Runs! Smacked straight down the ground for a one-bounce four!`,
            `🤌 +4 Runs! Pure timing, didn't even try to hit it hard.`
        ];
    } else if (runs === 6) {
        comments = [
            `🚀 +6 Runs! MASSIVE HIT! Out of the stadium!`,
            `🛸 +6 Runs! That went into orbit! Absolute monster of a shot!`,
            `🤯 +6 Runs! Stand and deliver! Dispatched into the top tier.`,
            `🏏 +6 Runs! Clean strike, right off the absolute meat of the bat!`,
            `🔥 +6 Runs! What a colossal maximum! Bowler looks stunned.`
        ];
    } else {
        comments = [
            `🏃 +${runs} Runs! Quick running between the wickets.`,
            `🏏 +${runs} Runs! Pushed gently into the gap.`,
            `👀 +${runs} Runs! Nicely timed, they scurry through.`,
            `⚡ +${runs} Runs! Great placement yields some easy runs.`,
            `🏃‍♂️ +${runs} Runs! Played softly with soft hands.`
        ];
    }
    
    writeCommentary(getRandomCommentary(comments));

    if (gameState.innings === 2 && currentBatterStats.runs >= gameState.target) {
        endGame(gameState.isPlayerBatting ? "PLAYER_WINS" : "COM_WINS");
    }
}

function triggerInningsChange(currentBatterStats) {
    if (gameState.innings === 1) {
        gameState.innings = 2;
        gameState.target = currentBatterStats.runs + 1;
        gameState.isPlayerBatting = !gameState.isPlayerBatting;
        
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
        insightBox.innerText = "The AI read your patterns like a book. Watch out for those Stumpings and try to randomize your throws more next time!";
    } else {
        insightBox.innerText = "A thriller that goes down to the wire! Nothing separates human and machine today.";
    }
}

function resetToToss() { location.reload(); }
function openAnalysis() { document.getElementById('analysis-modal').style.display = 'flex'; }
function closeAnalysis() { document.getElementById('analysis-modal').style.display = 'none'; }
