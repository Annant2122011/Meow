/* =========================================================
   CRICPULSE FUN-GUN ARENA | ULTIMATE STATS & AI ENGINE
   ========================================================= */

// Game State Object
let gameState = {
    maxWickets: 3,
    maxBalls: 30,
    aiDifficulty: 'easy',
    playerHistory: [], 
    tossChoice: null,
    isPlayerBatting: null,
    innings: 1,
    target: null,
    gameOver: false,
    isTransitioning: false, 
    playerConsecZeros: 0,
    compConsecZeros: 0,
    commentaryHistory: [], 
    playerStats: { 
        runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0, 
        wicketsLost: 0, hitCentury: false, dots: 0, currentWicketRuns: 0, 
        dismissalHistory: [], wicketRunsHistory: [], wormData: [{ball:0, runs:0, wkt:false}] 
    },
    compStats: { 
        runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0, 
        wicketsLost: 0, dots: 0, currentWicketRuns: 0, dismissalHistory: [], 
        wicketRunsHistory: [], wormData: [{ball:0, runs:0, wkt:false}] 
    }
};

let currentUser = null;
let srChartInstance = null;
let runsChartInstance = null;
let throwDnaInstance = null;
let fatalChartInstance = null;
let wormChartInstance = null;

// EMOJI: 6 is now Thumbs Up
const handEmojis = { 0: '🛡️', 1: '☝️', 2: '✌️', 3: '🤟', 4: '🖖', 5: '🖐️', 6: '👍' };

// DOM Elements
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

// --- INITIALIZATION & PAGE ROUTER ---
window.onload = function() {
    const storedUser = localStorage.getItem('hc_currentUser');
    const isProfilePage = document.getElementById('profile-page-container') !== null;

    if (isProfilePage) {
        if (!storedUser) { 
            window.location.href = 'index.html'; 
            return; 
        }
        currentUser = storedUser;
        syncUserData(currentUser);
        renderProfilePage();
    } else {
        if (storedUser) {
            loadUser(storedUser);
        } else {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.style.display = 'flex';
        }
    }
};

// --- DATA AUTO-PATCHER ---
function syncUserData(username) {
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    if (!usersDB[username]) usersDB[username] = {};
    let u = usersDB[username];
    
    u.matches = u.matches || 0; 
    u.wins = u.wins || 0; 
    u.losses = u.losses || 0; 
    u.ties = u.ties || 0;
    u.totalRuns = u.totalRuns || 0; 
    u.totalBallsFaced = u.totalBallsFaced || 0; 
    u.totalDismissals = u.totalDismissals || 0;
    u.totalRunsConceded = u.totalRunsConceded || 0; 
    u.totalBallsBowled = u.totalBallsBowled || 0;
    u.totalWicketsTaken = u.totalWicketsTaken || 0; 
    u.ducks = u.ducks || 0; 
    u.highestScore = u.highestScore || 0;
    
    if (!u.bestSpell) u.bestSpell = { wickets: 0, runs: 0 };
    if (!u.battingThrows) u.battingThrows = { '0':0, '1':0, '2':0, '3':0, '4':0, '5':0, '6':0 };
    if (!u.bowlingThrows) u.bowlingThrows = { '0':0, '1':0, '2':0, '3':0, '4':0, '5':0, '6':0 };
    if (!u.fatalThrows) u.fatalThrows = { '0':0, '1':0, '2':0, '3':0, '4':0, '5':0, '6':0 };
    
    u.careerDefenses = u.careerDefenses || 0; 
    u.careerSixes = u.careerSixes || 0; 
    u.careerFours = u.careerFours || 0; 
    u.aiDucksGivens = u.aiDucksGivens || 0; 
    u.successfulChases = u.successfulChases || 0; 
    u.tossesWon = u.tossesWon || 0; 
    u.notOutMatches = u.notOutMatches || 0; 
    u.careerDotsBowled = u.careerDotsBowled || 0;
    u.xp = u.xp || 0;

    if (!u.achievements) u.achievements = {};
    const defAch = { 
        theWall: false, hitman: false, sniper: false, veteran: false, 
        champion: false, runMachine: false, wicketTaker: false, sixerKing: false, 
        boundaryHitter: false, duckHunter: false, chaser: false, luckyCoin: false, 
        marathon: false, unbreakable: false, economical: false 
    };
    for(let key in defAch) { 
        if(u.achievements[key] === undefined) u.achievements[key] = defAch[key]; 
    }
    
    if (!u.last10SR) u.last10SR = [];
    if (!u.last20Innings) u.last20Innings = []; 
    
    localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
}

function loginUser() {
    const username = document.getElementById('username-input').value.trim().toUpperCase();
    if (!username) { 
        alert("Arena requires a Player Name!"); 
        return; 
    }
    syncUserData(username);
    localStorage.setItem('hc_currentUser', username);
    loadUser(username);
}

function getRankDetails(xp) {
    if (xp < 1000) return { title: 'Gully Cricketer', class: 'rank-gully' };
    if (xp < 3000) return { title: 'Club Player', class: 'rank-club' };
    if (xp < 7000) return { title: 'State Pro', class: 'rank-state' };
    return { title: 'Cricket God', class: 'rank-god' };
}

function applyRankUI(username, avatarBoxId) {
    const usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    const xp = usersDB[username].xp || 0;
    const rank = getRankDetails(xp);
    const avatarBox = document.getElementById(avatarBoxId);
    if(avatarBox) {
        avatarBox.className = ''; 
        avatarBox.classList.add(rank.class);
    }
    return { rank, xp };
}

function loadUser(username) {
    currentUser = username;
    syncUserData(username);
    
    const loginModal = document.getElementById('login-modal');
    const profileBtn = document.getElementById('user-profile-btn');
    const avatarText = document.getElementById('avatar-text');
    
    if (loginModal) loginModal.style.display = 'none';
    if (profileBtn) profileBtn.style.display = 'block';
    if (avatarText) avatarText.innerText = username.charAt(0);
    
    applyRankUI(username, 'header-avatar-box');
    
    if (setupScreen) setupScreen.style.display = 'block';
}

function logoutUser() {
    localStorage.removeItem('hc_currentUser');
    window.location.href = 'index.html';
}

function goToProfile() {
    window.location.href = 'profile.html';
}

// --- PROFILE PAGE RENDERER ---
function renderProfilePage() {
    const usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    const stats = usersDB[currentUser];
    
    if (!stats) return logoutUser();
    
    document.getElementById('prof-username').innerText = currentUser;
    document.getElementById('prof-avatar-letter').innerText = currentUser.charAt(0);
    
    const rankData = applyRankUI(currentUser, 'prof-avatar-box');
    const rText = document.getElementById('prof-rank'); 
    if(rText) { 
        rText.innerText = rankData.rank.title; 
        rText.className = ''; 
        rText.classList.add(rankData.rank.class); 
    }
    
    const xText = document.getElementById('prof-xp'); 
    if(xText) xText.innerText = `LIFETIME XP: ${rankData.xp}`;

    document.getElementById('prof-matches').innerText = stats.matches;
    document.getElementById('prof-wins').innerText = stats.wins;
    document.getElementById('prof-losses').innerText = stats.losses;
    document.getElementById('prof-ties').innerText = stats.ties;
    document.getElementById('prof-total-runs').innerText = stats.totalRuns;
    document.getElementById('prof-total-wickets').innerText = stats.totalWicketsTaken;
    document.getElementById('prof-hs').innerText = stats.highestScore;
    document.getElementById('prof-ducks').innerText = stats.ducks;
    
    // CORRECTED: Batting Average = Total Runs / Total Matches
    let batAvg = "0.00";
    if (stats.matches > 0) {
        batAvg = (stats.totalRuns / stats.matches).toFixed(2);
    }
    document.getElementById('prof-bat-avg').innerText = batAvg;

    const wickets = stats.totalWicketsTaken || 0;
    document.getElementById('prof-bowl-avg').innerText = wickets > 0 ? (stats.totalRunsConceded / wickets).toFixed(2) : "-";

    const avgSR = stats.totalBallsFaced > 0 ? ((stats.totalRuns / stats.totalBallsFaced) * 100).toFixed(2) : "0.00";
    const oversBowled = stats.totalBallsBowled / 6;
    const avgEco = oversBowled > 0 ? (stats.totalRunsConceded / oversBowled).toFixed(2) : "0.00";
    
    document.getElementById('prof-sr').innerText = avgSR;
    document.getElementById('prof-eco').innerText = avgEco;
    
    document.getElementById('prof-best-spell').innerText = stats.bestSpell.wickets > 0 ? `${stats.bestSpell.wickets}/${stats.bestSpell.runs}` : "-";

    const achData = [
        { id: 'wall', current: stats.careerDefenses, max: 15, unlocked: stats.achievements.theWall },
        { id: 'hitman', current: stats.highestScore, max: 100, unlocked: stats.achievements.hitman },
        { id: 'sniper', current: stats.achievements.sniper ? 1 : 0, max: 1, unlocked: stats.achievements.sniper },
        { id: 'veteran', current: stats.matches, max: 50, unlocked: stats.achievements.veteran },
        { id: 'champion', current: stats.wins, max: 20, unlocked: stats.achievements.champion },
        { id: 'runmachine', current: stats.totalRuns, max: 1000, unlocked: stats.achievements.runMachine },
        { id: 'wickettaker', current: stats.totalWicketsTaken, max: 50, unlocked: stats.achievements.wicketTaker },
        { id: 'sixerking', current: stats.careerSixes, max: 100, unlocked: stats.achievements.sixerKing },
        { id: 'boundaryhitter', current: stats.careerFours, max: 200, unlocked: stats.achievements.boundaryHitter },
        { id: 'duckhunter', current: stats.aiDucksGivens, max: 5, unlocked: stats.achievements.duckHunter },
        { id: 'chaser', current: stats.successfulChases, max: 10, unlocked: stats.achievements.chaser },
        { id: 'luckycoin', current: stats.tossesWon, max: 25, unlocked: stats.achievements.luckyCoin },
        { id: 'marathon', current: stats.totalBallsFaced, max: 500, unlocked: stats.achievements.marathon },
        { id: 'unbreakable', current: stats.notOutMatches, max: 10, unlocked: stats.achievements.unbreakable },
        { id: 'economical', current: stats.careerDotsBowled, max: 100, unlocked: stats.achievements.economical }
    ];

    setTimeout(() => {
        achData.forEach(ach => {
            let prog = ach.current > ach.max ? ach.max : ach.current;
            let pct = (prog / ach.max) * 100;
            const fillEl = document.getElementById(`prog-fill-${ach.id}`);
            const textEl = document.getElementById(`prog-text-${ach.id}`);
            const badgeEl = document.getElementById(`badge-${ach.id}`);
            
            if(fillEl) fillEl.style.width = `${pct}%`;
            if(textEl) textEl.innerText = `${prog} / ${ach.max}`;
            if(badgeEl && (prog >= ach.max || ach.unlocked)) badgeEl.classList.add('unlocked');
        });
    }, 100);

    // --- CHART.JS GENERATION ---
    if(srChartInstance) srChartInstance.destroy();
    if(runsChartInstance) runsChartInstance.destroy();
    if(throwDnaInstance) throwDnaInstance.destroy();
    if(fatalChartInstance) fatalChartInstance.destroy();

    const srCtxElement = document.getElementById('srLineChart');
    if (srCtxElement) {
        srChartInstance = new Chart(srCtxElement.getContext('2d'), {
            type: 'line', 
            data: { 
                labels: stats.last10SR ? stats.last10SR.map((_, i) => `M${i+1}`) : [], 
                datasets: [{ label: 'Strike Rate', data: stats.last10SR || [], borderColor: '#00ff88', backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 2, fill: true, tension: 0.3 }] 
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: {color: 'rgba(255,255,255,0.1)'} }, x: { grid: {color: 'rgba(255,255,255,0.1)'} } }, color: '#fff' }
        });
    }

    const runsCtxElement = document.getElementById('runsBarChart');
    if (runsCtxElement) {
        runsChartInstance = new Chart(runsCtxElement.getContext('2d'), {
            type: 'bar', 
            data: { 
                labels: stats.last20Innings ? stats.last20Innings.map((inn, i) => `Wkt ${i+1}${inn.notOut ? '*' : ''}`) : [], 
                datasets: [{ label: 'Runs Scored', data: stats.last20Innings ? stats.last20Innings.map(inn => inn.runs) : [], backgroundColor: '#00d2ff', borderRadius: 4 }] 
            },
            options: { 
                plugins: { legend: { display: false }, tooltip: { callbacks: { title: function(c) { return c[0].label.includes('*') ? c[0].label + ' (Not Out)' : c[0].label; } } } }, 
                scales: { y: { beginAtZero: true, grid: {color: 'rgba(255,255,255,0.1)'} }, x: { grid: {color: 'rgba(255,255,255,0.1)'}, ticks: { font: {size: 10} } } }, color: '#fff' 
            }
        });
    }

    const dnaCtxElement = document.getElementById('throwDnaChart');
    if (dnaCtxElement && stats.battingThrows) {
        const t = stats.battingThrows;
        throwDnaInstance = new Chart(dnaCtxElement.getContext('2d'), {
            type: 'radar', 
            data: { 
                labels: ['1', '2', '3', '4', '5', '6', '0 (Defend)'], 
                datasets: [{ label: 'Times Thrown', data: [t['1'], t['2'], t['3'], t['4'], t['5'], t['6'], t['0']], backgroundColor: 'rgba(0, 255, 136, 0.2)', borderColor: '#00ff88', pointBackgroundColor: '#fff', borderWidth: 2 }] 
            },
            options: { 
                plugins: { legend: { display: false } }, 
                scales: { 
                    r: { 
                        min: 0, 
                        beginAtZero: true, 
                        angleLines: { color: 'rgba(255,255,255,0.1)' }, 
                        grid: { color: 'rgba(255,255,255,0.1)' }, 
                        pointLabels: { color: '#fff', font: {size: 14, family: "'Orbitron', sans-serif"} }, 
                        ticks: { display: false } 
                    } 
                } 
            }
        });
    }

    const fatalCtxElement = document.getElementById('fatalThrowsChart');
    if (fatalCtxElement && stats.fatalThrows) {
        const ft = stats.fatalThrows;
        fatalChartInstance = new Chart(fatalCtxElement.getContext('2d'), {
            type: 'radar', 
            data: { 
                labels: ['1', '2', '3', '4', '5', '6', '0 (Wkt/Stmp)'], 
                datasets: [{ label: 'Got Out On', data: [ft['1'], ft['2'], ft['3'], ft['4'], ft['5'], ft['6'], ft['0']], backgroundColor: 'rgba(255, 42, 42, 0.2)', borderColor: '#ff2a2a', pointBackgroundColor: '#fff', borderWidth: 2 }] 
            },
            options: { 
                plugins: { legend: { display: false } }, 
                scales: { 
                    r: { 
                        min: 0, 
                        beginAtZero: true, 
                        angleLines: { color: 'rgba(255,255,255,0.1)' }, 
                        grid: { color: 'rgba(255,255,255,0.1)' }, 
                        pointLabels: { color: '#fff', font: {size: 14, family: "'Orbitron', sans-serif"} }, 
                        ticks: { display: false } 
                    } 
                } 
            }
        });
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active-content'));
    const eventObj = window.event;
    if (eventObj && eventObj.target) eventObj.target.classList.add('active-tab');
    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add('active-content');
}

// --- VISUAL EFFECTS ---
function fireConfetti() {
    if (typeof confetti !== 'undefined') {
        var duration = 3000; 
        var end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00ff88', '#00d2ff'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00ff88', '#00d2ff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div'); 
    toast.className = 'toast'; 
    toast.innerText = message;
    container.appendChild(toast); 
    setTimeout(() => { if(container.contains(toast)) container.removeChild(toast); }, 5000);
}

function updateAtmosphere() {
    const body = document.body;
    if (gameState.innings === 2 && gameState.isPlayerBatting && !gameState.gameOver) {
        const runsNeeded = gameState.target - gameState.playerStats.runs;
        const ballsLeft = gameState.maxBalls - gameState.playerStats.balls;
        if (runsNeeded > 0 && runsNeeded <= 15 && ballsLeft <= 12) { 
            body.classList.add('danger-pulse'); 
            return; 
        }
    }
    body.classList.remove('danger-pulse');
}

// --- GAME UI & SETUP ---
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
    
    let aiMode = gameState.aiDifficulty === 'hard' ? "PRO AI (Career Analysis Active)" : "CASUAL AI (Random)";
    let formatMode = gameState.maxBalls === Infinity ? "CLASSIC FORMAT" : `T${gameState.maxBalls/6} FORMAT`;
    gameState.commentaryHistory.push(`--- WELCOME TO THE ARENA | ${formatMode} | ${aiMode} ---`);
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

    if (playerWins && currentUser) {
        let uDB = JSON.parse(localStorage.getItem('hc_usersDB'));
        uDB[currentUser].tossesWon += 1;
        localStorage.setItem('hc_usersDB', JSON.stringify(uDB));
    }

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
    
    const pScore = document.getElementById('player-hand-score'); 
    if (pScore) pScore.innerText = gameState.playerStats.runs;
    
    const pWkts = document.getElementById('player-hand-wickets'); 
    if (pWkts) pWkts.innerText = gameState.playerStats.wicketsLost;
    
    const pOvers = document.getElementById('player-overs'); 
    if (pOvers) pOvers.innerText = ballsToOvers(gameState.playerStats.balls);
    
    const cScore = document.getElementById('computer-hand-score'); 
    if (cScore) cScore.innerText = gameState.compStats.runs;
    
    const cWkts = document.getElementById('computer-hand-wickets'); 
    if (cWkts) cWkts.innerText = gameState.compStats.wicketsLost;
    
    const cOvers = document.getElementById('computer-overs'); 
    if (cOvers) cOvers.innerText = ballsToOvers(gameState.compStats.balls);

    const maxOversText = gameState.maxBalls === Infinity ? " (Unlimited)" : ` / ${gameState.maxBalls/6}.0`;
    
    const pMaxOvers = document.getElementById('player-max-overs'); 
    if (pMaxOvers) pMaxOvers.innerText = maxOversText;
    
    const cMaxOvers = document.getElementById('computer-max-overs'); 
    if (cMaxOvers) cMaxOvers.innerText = maxOversText;

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
    
    updateAtmosphere();
}

function getComputerThrow() {
    let compNum; 
    let isCompBatting = !gameState.isPlayerBatting;
    
    if (gameState.compConsecZeros >= 2) return Math.floor(Math.random() * 6) + 1;
    if (gameState.aiDifficulty === 'easy' || !currentUser) return Math.floor(Math.random() * 7);

    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {}; 
    let stats = usersDB[currentUser];
    
    if (!stats || !stats.battingThrows) return Math.floor(Math.random() * 7);

    if (!isCompBatting) {
        let pBats = stats.battingThrows;
        let likelyThrow = Object.keys(pBats).reduce((a, b) => pBats[a] > pBats[b] ? a : b);
        return (Math.random() < 0.75) ? parseInt(likelyThrow) : Math.floor(Math.random() * 7);
    } else {
        let pBowls = stats.bowlingThrows;
        let likelyThrow = Object.keys(pBowls).reduce((a, b) => pBowls[a] > pBowls[b] ? a : b);
        let compNum = Math.floor(Math.random() * 7);
        let attempts = 0;
        
        while (compNum === parseInt(likelyThrow) && attempts < 5) { 
            compNum = Math.floor(Math.random() * 7); 
            attempts++; 
        }
        return compNum;
    }
}

// --- CORE GAMEPLAY LOGIC ---
function playHand(playerNum) {
    if (gameState.gameOver || gameState.isTransitioning) return;

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
    else if ((gameState.isPlayerBatting && compNum === 0) || (!gameState.isPlayerBatting && playerNum === 0)) handleWide(batNum);
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
    
    if (!gameState.isPlayerBatting) gameState.compStats.dots++; 
    
    const batterName = gameState.isPlayerBatting ? "You" : "Computer";
    currentBatterStats.outOn = (type === 'HIT_WICKET') ? '0 (Hit Wkt)' : (type === 'STUMPED' ? '0 (Stumped)' : num);
    
    // MID-MATCH WICKET LOGGING FOR FATAL FLAWS & INNINGS CHART
    let outNum = (type === 'HIT_WICKET' || type === 'STUMPED') ? '0' : num.toString();
    currentBatterStats.dismissalHistory.push({ num: outNum, type: type });
    currentBatterStats.wicketRunsHistory.push({ runs: currentBatterStats.currentWicketRuns, notOut: false });
    
    currentBatterStats.currentWicketRuns = 0; // Reset for next batter

    // PUSH WORM DATA
    currentBatterStats.wormData.push({ ball: currentBatterStats.balls, runs: currentBatterStats.runs, wkt: true });

    if (type === 'STUMPED') writeCommentary(`🚨 WIDE AND STUMPED! Lightning-fast glovework removes ${batterName}!`);
    else if (type === 'HIT_WICKET') writeCommentary(`🏏💥 HIT WICKET! ${batterName} defended too deep (3x 0s) and stepped on the stumps! OUT!`);
    else writeCommentary(`💥 WICKET! Clean bowled! Both threw ${num}. ${batterName} departs!`);

    if (!gameState.isPlayerBatting && gameState.compStats.runs === 0 && currentUser) {
        let usersDB = JSON.parse(localStorage.getItem('hc_usersDB'));
        if (usersDB[currentUser] && !usersDB[currentUser].achievements.sniper) { 
            usersDB[currentUser].achievements.sniper = true; 
            localStorage.setItem('hc_usersDB', JSON.stringify(usersDB)); 
            showToast("🎯 ACHIEVEMENT UNLOCKED: Sniper (Wicket on 0 Runs!)"); 
        }
    }
}

function handleWide(batterNum) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    const runsToAdd = batterNum + 1; 
    
    currentBatterStats.runs += runsToAdd; 
    currentBatterStats.extras += runsToAdd; 
    currentBatterStats.currentWicketRuns += runsToAdd;
    
    // UPDATE WORM DATA (Wide doesn't add a ball, so update last point)
    currentBatterStats.wormData[currentBatterStats.wormData.length - 1].runs = currentBatterStats.runs;

    const team = gameState.isPlayerBatting ? "You" : "Computer";
    writeCommentary(`↔️ WIDE BALL! Bowler threw 0. Batter threw ${batterNum}. +${runsToAdd} Runs to ${team}. (Ball not counted)`);
    
    if (gameState.innings === 2 && currentBatterStats.runs >= gameState.target) {
        endGame(gameState.isPlayerBatting ? "PLAYER_WINS" : "COM_WINS");
    }
}

function handleDefense() {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.balls++;
    
    if (!gameState.isPlayerBatting) gameState.compStats.dots++;
    
    currentBatterStats.wormData.push({ ball: currentBatterStats.balls, runs: currentBatterStats.runs, wkt: false });
    writeCommentary(`🛡️ SOLID DEFENSE! Batter blocked the ball safely. 0 runs.`);

    if (gameState.isPlayerBatting && currentUser) {
        let usersDB = JSON.parse(localStorage.getItem('hc_usersDB'));
        if (usersDB[currentUser]) { 
            usersDB[currentUser].careerDefenses += 1; 
            if (usersDB[currentUser].careerDefenses >= 15 && !usersDB[currentUser].achievements.theWall) { 
                usersDB[currentUser].achievements.theWall = true; 
                showToast("🧱 ACHIEVEMENT UNLOCKED: The Wall (15 Defenses)"); 
            } 
            localStorage.setItem('hc_usersDB', JSON.stringify(usersDB)); 
        }
    }
}

function handleRuns(runs) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.runs += runs; 
    currentBatterStats.balls++; 
    currentBatterStats.currentWicketRuns += runs;
    
    currentBatterStats.wormData.push({ ball: currentBatterStats.balls, runs: currentBatterStats.runs, wkt: false });

    if (runs === 4) { 
        currentBatterStats.fours++; 
        writeCommentary(`🔥 +4 Runs! Glorious cover drive!`); 
    }
    else if (runs === 6) { 
        currentBatterStats.sixes++; 
        writeCommentary(`🚀 👍 +6 Runs! MASSIVE HIT!`); 
    }
    else {
        writeCommentary(`🏃 +${runs} Runs! Quick running.`);
    }

    if (gameState.isPlayerBatting && currentBatterStats.runs >= 100 && !currentBatterStats.hitCentury) {
        currentBatterStats.hitCentury = true; 
        fireConfetti();
        if (currentUser) { 
            let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
            if (usersDB[currentUser] && !usersDB[currentUser].achievements.hitman) { 
                usersDB[currentUser].achievements.hitman = true; 
                localStorage.setItem('hc_usersDB', JSON.stringify(usersDB)); 
                showToast("🏏 ACHIEVEMENT UNLOCKED: Hitman (Scored a Century!)"); 
            } 
        }
    }
}

function checkMatchState() {
    const stats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    
    if (gameState.innings === 2 && stats.runs >= gameState.target) {
        return endGame(gameState.isPlayerBatting ? "PLAYER_WINS" : "COM_WINS");
    }
    
    const isAllOut = stats.wicketsLost >= gameState.maxWickets; 
    const isOversDone = stats.balls >= gameState.maxBalls;
    
    if (isAllOut || isOversDone) {
        const reason = isAllOut ? "ALL OUT" : "OVERS COMPLETED";
        
        if (gameState.innings === 1) {
            triggerInningsChange(stats, reason);
        } else { 
            if (stats.runs < gameState.target - 1) {
                endGame(gameState.isPlayerBatting ? "COM_WINS" : "PLAYER_WINS");
            } else if (stats.runs === gameState.target - 1) {
                endGame("TIE");
            }
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
    document.body.classList.remove('danger-pulse');
    
    setTimeout(() => {
        gameState.commentaryHistory.push(`\n--- INNINGS BREAK (${reason}) ---`); 
        gameState.commentaryHistory.push(`--- MATCH START | 2ND INNINGS THE CHASE ---`);
        
        writeCommentary(`${reason}! Target is ${gameState.target}. ${gameState.isPlayerBatting ? "Time to chase!" : "Defend this total!"}`);
        
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

// --- WORM CHART GRAPHICS ---
function drawWormChart() {
    const ctxElement = document.getElementById('wormChart');
    if (!ctxElement) return;
    if (wormChartInstance) wormChartInstance.destroy();

    let maxB = Math.max(gameState.playerStats.balls, gameState.compStats.balls);
    let labels = Array.from({length: maxB + 1}, (_, i) => i);
    
    let pData = Array(maxB + 1).fill(null); 
    let pRadii = Array(maxB + 1).fill(0);
    gameState.playerStats.wormData.forEach(d => { 
        pData[d.ball] = d.runs; 
        if(d.wkt) pRadii[d.ball] = 5; 
    });
    for(let i=1; i<=gameState.playerStats.balls; i++) { 
        if(pData[i] === null) pData[i] = pData[i-1]; 
    }

    let cData = Array(maxB + 1).fill(null); 
    let cRadii = Array(maxB + 1).fill(0);
    gameState.compStats.wormData.forEach(d => { 
        cData[d.ball] = d.runs; 
        if(d.wkt) cRadii[d.ball] = 5; 
    });
    for(let i=1; i<=gameState.compStats.balls; i++) { 
        if(cData[i] === null) cData[i] = cData[i-1]; 
    }

    wormChartInstance = new Chart(ctxElement.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Your Score', data: pData, borderColor: '#00d2ff', backgroundColor: '#00d2ff', borderWidth: 3, pointRadius: pRadii, pointBackgroundColor: '#ff2a2a', tension: 0.1 },
                { label: 'COM Score', data: cData, borderColor: '#ff2a2a', backgroundColor: '#ff2a2a', borderWidth: 3, pointRadius: cRadii, pointBackgroundColor: '#fff', borderDash: [5, 5], tension: 0.1 }
            ]
        },
        options: { 
            plugins: { legend: { labels: { color: '#fff' } } }, 
            scales: { 
                y: { beginAtZero: true, grid: {color: 'rgba(255,255,255,0.1)'} }, 
                x: { title: { display: true, text: 'Balls', color: '#a1a1aa' }, grid: {color: 'rgba(255,255,255,0.1)'} } 
            }, 
            color: '#fff' 
        }
    });
}

function endGame(result) {
    gameState.gameOver = true; 
    actionArea.style.display = 'none'; 
    document.getElementById('end-game-controls').style.display = 'flex';
    document.body.classList.remove('danger-pulse');
    
    if (result === "PLAYER_WINS") { 
        inningsStatus.innerText = "🏆 YOU WON THE MATCH!"; 
        inningsStatus.style.background = "var(--accent-blue)"; 
        fireConfetti(); 
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

function evaluateAchievements(stats) {
    const checks = [
        { key: 'veteran', current: stats.matches, max: 50, title: 'Veteran (50 Matches)' },
        { key: 'champion', current: stats.wins, max: 20, title: 'Champion (20 Wins)' },
        { key: 'runMachine', current: stats.totalRuns, max: 1000, title: 'Run Machine (1000 Runs)' },
        { key: 'wicketTaker', current: stats.totalWicketsTaken, max: 50, title: 'Wicket Taker (50 Wickets)' },
        { key: 'sixerKing', current: stats.careerSixes, max: 100, title: 'Sixer King (100 Sixes)' },
        { key: 'boundaryHitter', current: stats.careerFours, max: 200, title: 'Boundary Hitter (200 Fours)' },
        { key: 'duckHunter', current: stats.aiDucksGivens, max: 5, title: 'Duck Hunter (5 AI Ducks)' },
        { key: 'chaser', current: stats.successfulChases, max: 10, title: 'Chaser (10 Successful Chases)' },
        { key: 'luckyCoin', current: stats.tossesWon, max: 25, title: 'Lucky Coin (25 Toss Wins)' },
        { key: 'marathon', current: stats.totalBallsFaced, max: 500, title: 'Marathon (Face 500 Balls)' },
        { key: 'unbreakable', current: stats.notOutMatches, max: 10, title: 'Unbreakable (10 Not Outs)' },
        { key: 'economical', current: stats.careerDotsBowled, max: 100, title: 'Economical (Bowl 100 Dots)' }
    ];
    checks.forEach(ach => {
        if (!stats.achievements[ach.key] && ach.current >= ach.max) {
            stats.achievements[ach.key] = true; 
            showToast(`🏆 UNLOCKED: ${ach.title}!`);
        }
    });
}

function saveLifetimeStats(result) {
    if (!currentUser) return;
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {}; 
    let stats = usersDB[currentUser];
    
    // Calculate Base XP
    let matchXP = 50; 
    if (result === "PLAYER_WINS") matchXP += 100;
    matchXP += gameState.playerStats.runs;
    matchXP += (gameState.compStats.wicketsLost * 10);
    stats.xp = (stats.xp || 0) + matchXP;

    stats.matches += 1;
    if (result === "PLAYER_WINS") stats.wins += 1; 
    else if (result === "COM_WINS") stats.losses += 1; 
    else stats.ties += 1;
    
    stats.totalRuns += gameState.playerStats.runs; 
    stats.totalBallsFaced += gameState.playerStats.balls;
    stats.careerSixes += gameState.playerStats.sixes; 
    stats.careerFours += gameState.playerStats.fours;
    stats.careerDotsBowled += gameState.compStats.dots; 
    
    if (gameState.playerStats.runs > stats.highestScore) {
        stats.highestScore = gameState.playerStats.runs;
    }
    
    if (result === "PLAYER_WINS" && gameState.innings === 2 && gameState.isPlayerBatting) {
        stats.successfulChases += 1;
    }

    if (!stats.last20Innings) stats.last20Innings = []; 

    // PROCESS ALL WICKETS FOR FATAL FLAWS
    gameState.playerStats.dismissalHistory.forEach(d => {
        stats.totalDismissals += 1;
        stats.fatalThrows[d.num] = (stats.fatalThrows[d.num] || 0) + 1;
    });

    // PROCESS RUNS PER WICKET FOR INNINGS SCORE CHART
    gameState.playerStats.wicketRunsHistory.forEach(w => {
        if (w.runs === 0) stats.ducks += 1;
        stats.last20Innings.push({ runs: w.runs, notOut: false });
    });

    // PUSH FINAL NOT-OUT SCORE
    if (gameState.playerStats.wicketsLost < gameState.maxWickets && gameState.playerStats.balls > 0) {
        stats.notOutMatches += 1; 
        stats.last20Innings.push({ runs: gameState.playerStats.currentWicketRuns, notOut: true });
    }
    
    while(stats.last20Innings.length > 20) { 
        stats.last20Innings.shift(); 
    }

    stats.totalRunsConceded += gameState.compStats.runs; 
    stats.totalBallsBowled += gameState.compStats.balls;
    if (gameState.compStats.runs === 0 && gameState.compStats.wicketsLost > 0) {
        stats.aiDucksGivens += 1;
    }

    // CORRECTED BEST SPELL MATH
    if (gameState.compStats.wicketsLost > 0) {
        let currentWkts = gameState.compStats.wicketsLost;
        let currentRuns = gameState.compStats.runs;
        
        if (!stats.bestSpell) stats.bestSpell = { wickets: 0, runs: 0 };

        if (currentWkts > stats.bestSpell.wickets || 
           (currentWkts === stats.bestSpell.wickets && currentRuns < stats.bestSpell.runs) || 
           (stats.bestSpell.wickets === 0 && stats.bestSpell.runs === 0)) {
            stats.bestSpell = { wickets: currentWkts, runs: currentRuns };
        }
    }
    
    let pSR = gameState.playerStats.balls > 0 ? ((gameState.playerStats.runs / gameState.playerStats.balls) * 100).toFixed(2) : "0.00";
    if (!stats.last10SR) stats.last10SR = []; 
    stats.last10SR.push(parseFloat(pSR)); 
    if(stats.last10SR.length > 10) stats.last10SR.shift();

    evaluateAchievements(stats);
    usersDB[currentUser] = stats; 
    localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
    
    showToast(`⬆️ +${matchXP} XP Earned!`);
}

function populateStats(prefix, bStats, wStats) {
    const rElement = document.getElementById(`${prefix}-runs`); 
    if(rElement) rElement.innerText = bStats.runs;
    
    const wElement = document.getElementById(`${prefix}-wickets`); 
    if(wElement) wElement.innerText = bStats.wicketsLost;
    
    const bElement = document.getElementById(`${prefix}-balls`); 
    if(bElement) bElement.innerText = bStats.balls;
    
    const srElement = document.getElementById(`${prefix}-sr`); 
    if(srElement) srElement.innerText = bStats.balls > 0 ? ((bStats.runs / bStats.balls) * 100).toFixed(2) : "0.00";
    
    const rrElement = document.getElementById(`${prefix}-rr`); 
    if(rrElement) rrElement.innerText = bStats.balls > 0 ? ((bStats.runs / (bStats.balls/6))).toFixed(2) : "0.00";
    
    const boundsElement = document.getElementById(`${prefix}-bounds`); 
    if(boundsElement) boundsElement.innerText = bStats.fours + bStats.sixes;
    
    const foursElement = document.getElementById(`${prefix}-4s`); 
    if(foursElement) foursElement.innerText = bStats.fours;
    
    const sixesElement = document.getElementById(`${prefix}-6s`); 
    if(sixesElement) sixesElement.innerText = bStats.sixes;
    
    const outElement = document.getElementById(`${prefix}-out`); 
    if(outElement) outElement.innerText = bStats.outOn; 
    
    const extrasElement = document.getElementById(`${prefix}-extras`); 
    if(extrasElement) extrasElement.innerText = bStats.extras;
    
    const oversBowled = wStats.balls / 6; 
    const ecoElement = document.getElementById(`${prefix}-eco`); 
    if(ecoElement) ecoElement.innerText = oversBowled > 0 ? (wStats.runs / oversBowled).toFixed(2) : "0.00";
}

function generateAIInsight(result) {
    const insightBox = document.getElementById('ai-insight-text'); 
    if (!insightBox) return;
    if (gameState.aiDifficulty === 'hard') {
        insightBox.innerText = "Pro AI Engine Active: The computer analyzed your entire career throw history to predict your moves. Keep randomizing!";
    } else {
        insightBox.innerText = "Casual Match Completed. Try increasing the AI difficulty to 'Pro' to see how well the computer can read your mind!";
    }
}

function resetToToss() { 
    location.reload(); 
}

function openAnalysis() { 
    document.getElementById('analysis-modal').style.display = 'flex'; 
    drawWormChart(); 
}

function closeAnalysis() { 
    document.getElementById('analysis-modal').style.display = 'none'; 
}

function downloadPDF() {
    const btn = document.getElementById('pdf-btn'); 
    if (!btn) return;
    
    const originalText = btn.innerHTML; 
    btn.innerHTML = "⏳ GENERATING REPORT..."; 
    btn.disabled = true;

    try {
        if (typeof html2pdf === 'undefined') {
            throw new Error("PDF Engine currently loading. Please wait a moment and click again.");
        }

        const pStats = gameState.playerStats;
        const cStats = gameState.compStats;

        const pSR = pStats.balls > 0 ? ((pStats.runs / pStats.balls) * 100).toFixed(2) : "0.00";
        const cSR = cStats.balls > 0 ? ((cStats.runs / cStats.balls) * 100).toFixed(2) : "0.00";
        
        const pEco = cStats.balls > 0 ? (cStats.runs / (cStats.balls / 6)).toFixed(2) : "0.00";
        const cEco = pStats.balls > 0 ? (pStats.runs / (pStats.balls / 6)).toFixed(2) : "0.00";

        let innStatusText = "MATCH REPORT";
        const innEl = document.getElementById('innings-status');
        if (innEl) innStatusText = innEl.innerText.replace(/[🏏⚔️🏆💀🤝]/g, '').trim();

        const printElement = document.createElement('div');
        
        let pdfHTML = `
            <div style="font-family: Arial, sans-serif; color: #000000; padding: 20px; background: #ffffff; font-size: 15px; line-height: 1.5;">
                <div style="text-align: center; border-bottom: 4px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="font-size: 32px; font-weight: 900; color: #000000; margin: 0;">HAND CLASH</h1>
                    <h2 style="font-size: 18px; font-weight: 800; color: #000000; margin: 5px 0 0 0;">OFFICIAL MATCH REPORT</h2>
                </div>
                <div style="text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 30px; border-left: 8px solid #3b82f6; border: 2px solid #000000;">
                    <h3 style="margin: 0; font-size: 20px; color: #000000; font-weight: 900;">${innStatusText}</h3>
                </div>
                <table style="width: 100%; border-collapse: separate; border-spacing: 20px 0; margin-bottom: 30px;">
                    <tr>
                        <td style="width: 50%; vertical-align: top; background: #ffffff; border: 2px solid #000000; border-top: 8px solid #3b82f6; border-radius: 8px; padding: 20px;">
                            <h3 style="margin-top: 0; color: #000000; font-size: 18px; border-bottom: 2px solid #000000; padding-bottom: 10px; font-weight: 900;">YOUR PERFORMANCE</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #000000; font-weight: 700;">
                                <tr><td style="padding: 8px 0;">Runs Scored</td><td style="text-align: right; font-weight: 900; font-size: 18px;">${pStats.runs} <span style="font-size:13px; font-weight:bold;">(${pStats.balls} balls)</span></td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Wickets Lost</td><td style="text-align: right; font-weight: 900; color:#dc2626;">${pStats.wicketsLost}</td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Strike Rate</td><td style="text-align: right; font-weight: 900;">${pSR}</td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Boundaries</td><td style="text-align: right; font-weight: 900;">${pStats.fours + pStats.sixes} <span style="font-size:13px; font-weight:bold;">(4s: ${pStats.fours} | 6s: ${pStats.sixes})</span></td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Bowling Eco.</td><td style="text-align: right; font-weight: 900;">${pEco}</td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Extras Rcvd.</td><td style="text-align: right; font-weight: 900;">${pStats.extras}</td></tr>
                            </table>
                        </td>
                        <td style="width: 50%; vertical-align: top; background: #ffffff; border: 2px solid #000000; border-top: 8px solid #ef4444; border-radius: 8px; padding: 20px;">
                            <h3 style="margin-top: 0; color: #000000; font-size: 18px; border-bottom: 2px solid #000000; padding-bottom: 10px; font-weight: 900;">COM PERFORMANCE</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #000000; font-weight: 700;">
                                <tr><td style="padding: 8px 0;">Runs Scored</td><td style="text-align: right; font-weight: 900; font-size: 18px;">${cStats.runs} <span style="font-size:13px; font-weight:bold;">(${cStats.balls} balls)</span></td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Wickets Lost</td><td style="text-align: right; font-weight: 900; color:#dc2626;">${cStats.wicketsLost}</td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Strike Rate</td><td style="text-align: right; font-weight: 900;">${cSR}</td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Boundaries</td><td style="text-align: right; font-weight: 900;">${cStats.fours + cStats.sixes} <span style="font-size:13px; font-weight:bold;">(4s: ${cStats.fours} | 6s: ${cStats.sixes})</span></td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Bowling Eco.</td><td style="text-align: right; font-weight: 900;">${cEco}</td></tr>
                                <tr style="border-top: 1px solid #d1d5db;"><td style="padding: 8px 0;">Extras Rcvd.</td><td style="text-align: right; font-weight: 900;">${cStats.extras}</td></tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <h3 style="color: #000000; font-size: 20px; font-weight: 900; border-bottom: 4px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">BALL-BY-BALL MATCH LOG</h3>
        `;

        let currentGroup = '';
        gameState.commentaryHistory.forEach(log => {
            let safeText = log.replace(/[🪙🤖👤💥🏏🎯🧤😱↔️🙅‍♂️😬🎁🛡️🧱🛑👀🔥⚡🤌🚀🛸🤯🏃🏃‍♂️🚨🤦‍♂️😲🪵🏆💀🤝👍]/g, '').trim();
            safeText = safeText.replace('↳', '>').trim();
            
            let lineStyle = "margin: 4px 0; color: #000000; font-weight: 700;";
            
            if(safeText.includes("WICKET") || safeText.includes("STUMPED") || safeText.includes("HOWZAT") || safeText.includes("HIT WICKET")) {
                lineStyle = "margin: 4px 0; color: #b91c1c; font-weight: 900;";
            } else if (safeText.includes("+4") || safeText.includes("+6")) {
                lineStyle = "margin: 4px 0; color: #1d4ed8; font-weight: 900;";
            } else if (safeText.includes("---")) {
                lineStyle = "margin: 15px 0 5px 0; padding: 10px; background: #e5e7eb; border: 3px solid #000000; text-align: center; font-weight: 900; font-size: 16px;";
            }

            if (safeText.startsWith('[Ball') || safeText.startsWith('---') || safeText.includes('TOSS') || safeText.includes('elected to')) {
                if (currentGroup !== '') {
                    pdfHTML += `<div style="page-break-inside: avoid; break-inside: avoid; padding: 5px 0; border-bottom: 1px dashed #ccc;">${currentGroup}</div>`;
                }
                currentGroup = `<div style="${lineStyle}">${safeText}</div>`;
            } else {
                currentGroup += `<div style="${lineStyle}">${safeText}</div>`;
            }
        });
        
        if (currentGroup !== '') {
            pdfHTML += `<div style="page-break-inside: avoid; break-inside: avoid; padding: 5px 0; border-bottom: 1px dashed #ccc;">${currentGroup}</div>`;
        }

        pdfHTML += `
                <div style="margin-top: 50px; text-align: center; color: #000000; font-size: 14px; font-weight: 900; border-top: 3px solid #000000; padding-top: 20px; page-break-inside: avoid;">
                    Generated by Hand Clash Arena &bull; &copy; 2026
                </div>
            </div>`;

        printElement.innerHTML = pdfHTML;

        // Simplified native page-break configuration to prevent html2canvas loop
        const opt = {
            margin: 0.4, 
            filename: 'Hand_Clash_Match_Report.pdf', 
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true }, 
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(printElement).save().then(() => { 
            btn.innerHTML = originalText; 
            btn.disabled = false; 
        }).catch(err => {
            console.error("PDF engine promise caught an error:", err);
            btn.innerHTML = "❌ PDF ERROR";
            setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
        });

    } catch(err) {
        console.error("DOM access failed before PDF generation:", err);
        alert(err.message);
        btn.innerHTML = "❌ SYSTEM ERROR";
        setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
    }
}
