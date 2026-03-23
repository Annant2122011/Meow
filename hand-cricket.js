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
    
    // TOURNAMENT STATE
    isTournament: false,
    currentBoss: null,
    playerMatchBatting: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
    playerMatchBowling: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
    
    playerStats: {
        runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0,
        wicketsLost: 0, hitCentury: false, dots: 0, currentWicketRuns: 0,
        dismissalHistory: [], wicketRunsHistory: [], wormData: [{ ball: 0, runs: 0, wkt: false }]
    },
    compStats: {
        runs: 0, balls: 0, fours: 0, sixes: 0, outOn: '-', extras: 0,
        wicketsLost: 0, dots: 0, currentWicketRuns: 0, dismissalHistory: [],
        wicketRunsHistory: [], wormData: [{ ball: 0, runs: 0, wkt: false }]
    }
};

// MULTI-VARIATION COMMENTARY DATABASE
const commentaryDB = {
    wkt_stumped: [
        "🚨 WIDE AND STUMPED! Lightning-fast glovework removes [BATTER]!",
        "🧤 Brilliant stumping! [BATTER] dragged their foot out of the crease!",
        "⚡ Blink and you miss it! [BATTER] is stumped by a mile!",
        "🤯 Caught wandering! A careless mistake costs [BATTER] their wicket!",
        "🎯 Beautiful deception from the bowler, and the keeper finishes the job on [BATTER]!",
        "🕺 Dancing down the track? Bad idea. [BATTER] is stumped!"
    ],
    wkt_hit: [
        "🏏💥 HIT WICKET! [BATTER] defended too deep (3x 0s) and stepped on the stumps! OUT!",
        "🤦‍♂️ Oh dear! [BATTER] went so far back they kicked their own stumps!",
        "🪵 Clumsy footwork! [BATTER] knocks the bails off!",
        "😬 Disaster for [BATTER]! Stepped right onto the stumps while defending!",
        "🛑 Too defensive! [BATTER] retreated straight into the woodwork!",
        "😱 Unbelievable! [BATTER] is out hit wicket after retreating too far!"
    ],
    wkt_bowled: [
        "💥 WICKET! Clean bowled! Both threw [NUM]. [BATTER] departs!",
        "🎯 Knocked him over! A perfect delivery shatters the stumps of [BATTER]!",
        "🔥 Absolute seed! [BATTER] had no clue about that one. Bowled!",
        "🪵 TIMBER! The stumps go flying! [BATTER] is out!",
        "🤯 You miss, I hit! [BATTER] plays all over a straight one!",
        "⚡ What a delivery! Ripped through the defense of [BATTER]!"
    ],
    wide: [
        "↔️ WIDE BALL! Bowler threw 0. Batter threw [NUM]. +[RUNS] Runs to [TEAM].",
        "🎁 Free runs! Way outside the line. +[RUNS] to [TEAM]!",
        "🙅‍♂️ The umpire stretches his arms! Wide called. +[RUNS] for [TEAM].",
        "👀 Slipping down the leg side! Wide ball. +[RUNS] added to [TEAM]'s total.",
        "🧭 Lost the radar completely there! Wide ball, +[RUNS] for [TEAM].",
        "💸 Easy pickings. A loose delivery gifts +[RUNS] to [TEAM]."
    ],
    defend: [
        "🛡️ SOLID DEFENSE! Batter blocked the ball safely. 0 runs.",
        "🧱 Dead batted. No run there.",
        "🛑 Safely negotiated. Just blocking it out.",
        "🥱 A quiet dot ball. Respecting the bowler.",
        "🧘‍♂️ Well defended. Playing it safe with a solid block.",
        "📉 No risks taken. A solid forward defense for 0."
    ],
    run_1_3: [
        "🏃 +[RUNS] Runs! Quick running.",
        "⚡ Good hustle! They steal +[RUNS] runs.",
        "🏏 Pushed into the gap for +[RUNS].",
        "🏃‍♂️ Excellent running between the wickets gets them +[RUNS]!",
        "🤌 Soft hands, quick feet. That's +[RUNS] runs.",
        "💨 Scampering through for +[RUNS] quick ones."
    ],
    run_4: [
        "🔥 +4 Runs! Glorious cover drive!",
        "⚡ Pulled away beautifully to the boundary! +4!",
        "🚀 Shot of the day! Pierces the gap for 4 runs!",
        "💥 Crunched through the off-side! One bounce into the fence for 4!",
        "🏏 Sweet timing! The outfield is fast, and it races away for 4!",
        "🤌 Pure elegance! Leans into the drive and gets 4!"
    ],
    run_5: [
        "🏃🏃🏃 +5 Runs! Overthrows! What a mess in the field!",
        "🤪 Madness! 5 runs taken through sheer panic in the field!",
        "🏃‍♂️ Rare 5 runs! Great running combined with sloppy fielding!",
        "🎁 A gift of 5 runs! The fielding side falls apart!",
        "🤯 5 runs! Have you ever seen anything like it? Chaos!",
        "💨 Scampering for 5! The throw misses the stumps completely!"
    ],
    run_6: [
        "🚀 👍 +6 Runs! MASSIVE HIT!",
        "🛸 INTO THE ORBIT! That's a colossal 6!",
        "💥 BOOM! Dispatched into the crowd for 6 runs!",
        "🔥 Stand and deliver! A majestic 6 over long-on!",
        "🤯 Out of the stadium! Absolute brute force for 6!",
        "⚡ What a strike! Clean connection brings up a 6!"
    ]
};

// EXPANDED BOSS DATABASE (10 Bosses)
const bossInfo = [
    { 
        name: "The Rookie", icon: "🟢", color: "gray", desc: "Plays entirely randomly. A good warmup.", 
        taunts: { wkt: ["Oops, did I do that?", "Beginner's luck!"], six: ["Wow, I hit it far!", "That felt good!"] } 
    },
    { 
        name: "The Wall", icon: "🧱", color: "#00d2ff", desc: "Defends heavily. Hard to score boundaries against.", 
        taunts: { wkt: ["Impenetrable.", "You cannot break the wall.", "Patience is key."], six: ["A rare breach.", "Calculated risk."] } 
    },
    { 
        name: "The Slogger", icon: "🏏", color: "orange", desc: "Highly aggressive. Throws massive numbers.", 
        taunts: { wkt: ["A minor setback!", "I swing for the fences!"], six: ["OUT OF THE STADIUM!", "HAVE SOME OF THAT!", "TOO EASY!"] } 
    },
    { 
        name: "The Illusionist", icon: "🎭", color: "#b91c1c", desc: "Throws opposites. If you go high, he goes low.", 
        taunts: { wkt: ["Sleight of hand!", "Look over there!"], six: ["An illusion broke...", "Tricky!"] } 
    },
    { 
        name: "The Copycat", icon: "🪞", color: "#00bfa5", desc: "Mirrors your previous move perfectly.", 
        taunts: { wkt: ["Stop hitting yourself!", "I'm just like you!"], six: ["I let you have that one.", "Copying is hard..."] } 
    },
    { 
        name: "The Gambler", icon: "🎲", color: "#facc15", desc: "Takes wild guesses. Brilliant or awful.", 
        taunts: { wkt: ["Jackpot!", "Snake eyes for you!"], six: ["Bust!", "I'll double down next time!"] } 
    },
    { 
        name: "The Mathematician", icon: "🧮", color: "#9333ea", desc: "Calculates the weighted average of your throws.", 
        taunts: { wkt: ["Statistically inevitable.", "The numbers don't lie."], six: ["A statistical anomaly.", "Margin of error..."] } 
    },
    { 
        name: "The Sniper", icon: "🎯", color: "#ff2a2a", desc: "Reads lifetime stats. Highly predictive.", 
        taunts: { wkt: ["Predictable.", "Right in my crosshairs.", "I knew you'd throw that."], six: ["Precision strike.", "Calculated."] } 
    },
    { 
        name: "Grandmaster", icon: "🧙‍♂️", color: "#00ff88", desc: "Reads CURRENT match patterns. Learns in real-time.", 
        taunts: { wkt: ["Checkmate.", "Your patterns betray you.", "I am three moves ahead."], six: ["Flawless execution.", "Masterclass."] } 
    },
    { 
        name: "Cricket God", icon: "👑", color: "#fbbf24", desc: "The ultimate challenge. Near-perfect prediction.", 
        taunts: { wkt: ["Bow to the God.", "You cannot defy destiny."], six: ["A mere mortal strikes?", "Blasphemy!"] } 
    }
];

let tossData = { caller: null, call: null, result: null };
let currentUser = null;
let srChartInstance = null;
let runsChartInstance = null;
let throwDnaInstance = null;
let fatalChartInstance = null;
let wormChartInstance = null;

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
    const isTournamentPage = document.getElementById('tournament-page-container') !== null;

    if (isProfilePage || isTournamentPage) {
        if (!storedUser) {
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = storedUser;
        syncUserData(currentUser);
       applyCosmetics();
        
        if (isProfilePage) {
            renderProfilePage();
           renderShop();
        }
        
        if (isTournamentPage) {
            renderTournamentPage();
        }
    } else {
        if (storedUser) {
            loadUser(storedUser);
        } else {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'flex';
            }
        }
    }
   
};

// --- DATA AUTO-PATCHER ---
function syncUserData(username) {
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    
    if (!usersDB[username]) {
        usersDB[username] = {};
    }
    
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
    
    if (!u.bestSpell) {
        u.bestSpell = { wickets: 0, runs: 0 };
    }
    
    if (!u.battingThrows) {
        u.battingThrows = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    }
    
    if (!u.bowlingThrows) {
        u.bowlingThrows = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    }
    
    if (!u.fatalThrows) {
        u.fatalThrows = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    }
    
    u.careerDefenses = u.careerDefenses || 0;
    u.careerSixes = u.careerSixes || 0;
    u.careerFours = u.careerFours || 0;
    u.aiDucksGivens = u.aiDucksGivens || 0;
    u.successfulChases = u.successfulChases || 0;
    u.tossesWon = u.tossesWon || 0;
    u.notOutMatches = u.notOutMatches || 0;
    u.careerDotsBowled = u.careerDotsBowled || 0;
   u.xp = u.xp || 0;
    u.tournamentLevel = u.tournamentLevel || 0;

    // PASTE THIS HERE:
    if (u.coins === undefined) u.coins = Math.floor((u.xp || 0) * 0.5);
    u.unlockedAvatars = u.unlockedAvatars || ['👤']; 
    u.unlockedThemes = u.unlockedThemes || ['default']; 
    u.unlockedCoins = u.unlockedCoins || ['default'];
    u.equippedAvatar = u.equippedAvatar || '👤'; 
    u.equippedTheme = u.equippedTheme || 'default'; 
    u.equippedCoin = u.equippedCoin || 'default';

    if (!u.achLevels) {
        u.achLevels = {};
    }
    
    if (!u.last10SR) {
        u.last10SR = [];
    }
    
    if (!u.last20Innings) {
        u.last20Innings = [];
    }
    
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
    if (xp < 1000) {
        return { title: 'Gully Cricketer', class: 'rank-gully' };
    }
    if (xp < 3000) {
        return { title: 'Club Player', class: 'rank-club' };
    }
    if (xp < 7000) {
        return { title: 'State Pro', class: 'rank-state' };
    }
    return { title: 'Cricket God', class: 'rank-god' };
}

function applyRankUI(username, avatarBoxId) {
    const usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    const xp = usersDB[username].xp || 0;
    const rank = getRankDetails(xp);
    const avatarBox = document.getElementById(avatarBoxId);
    
    if (avatarBox) {
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
    
    if (loginModal) {
        loginModal.style.display = 'none';
    }
    
    if (profileBtn) {
        profileBtn.style.display = 'block';
    }
    
    if (avatarText) {
        avatarText.innerText = username.charAt(0);
    }
    
    applyRankUI(username, 'header-avatar-box');
    
    // TOURNAMENT INTERCEPTOR
    const activeBoss = localStorage.getItem('hc_tourney_boss');
    
    if (activeBoss !== null) {
        gameState.isTournament = true;
        gameState.currentBoss = parseInt(activeBoss);
        const boss = bossInfo[gameState.currentBoss];
        
        gameState.maxWickets = 3;
        gameState.maxBalls = 30;
        
        if (setupScreen) {
            setupScreen.style.display = 'none';
        }
        
        const sub = document.querySelector('.game-subtitle');
        if (sub) {
            sub.innerText = `VS ${boss.icon} ${boss.name}`;
            sub.style.color = boss.color;
            sub.style.fontWeight = "bold";
        }
        
        goToToss();
    } else {
        if (setupScreen) {
            setupScreen.style.display = 'block';
        }
    }
}

// --- NEW LOGOUT & RESTART WITH PERMISSION ---

function logoutUser() {
    if (confirm("Are you sure you want to log out and switch accounts?")) {
        localStorage.removeItem('hc_currentUser');
        window.location.href = 'index.html';
    }
}

function resetGauntlet() {
    if (!currentUser) return;
    
    if (confirm("🚨 WARNING: Are you sure you want to restart The Gauntlet? All your defeated bosses will be locked again!")) {
        let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
        if (usersDB[currentUser]) {
            usersDB[currentUser].tournamentLevel = 0;
            localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
            renderTournamentPage();
            showToast("🔄 The Gauntlet has been restarted!");
        }
    }
}

function goToProfile() {
    window.location.href = 'profile.html';
}

// --- THE GAUNTLET MENU LOGIC ---
function renderTournamentPage() {
    const usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    const stats = usersDB[currentUser];
    const tLevel = stats.tournamentLevel || 0;
    
    let html = '<div class="boss-grid">';
    
    bossInfo.forEach((boss, i) => {
        let statusClass = 'boss-locked';
        let actionHtml = `<span class="locked-badge">🔒 LOCKED</span>`;
        
        if (i < tLevel) {
            statusClass = 'boss-defeated';
            actionHtml = `<span class="defeated-badge">✅ DEFEATED</span> <button class="fight-btn" style="background:gray; margin-left:15px; font-size: 0.9rem;" onclick="startBossFight(${i})">REPLAY</button>`;
        } else if (i === tLevel) {
            statusClass = 'boss-active';
            actionHtml = `<button class="fight-btn" onclick="startBossFight(${i})">⚔️ FIGHT</button>`;
        }
        
        html += `
            <div class="boss-card ${statusClass}" style="border-left: 5px solid ${boss.color};">
                <div class="boss-icon">${boss.icon}</div>
                <div class="boss-info">
                    <div class="boss-name" style="color: ${i === tLevel ? boss.color : 'white'};">${boss.name}</div>
                    <div class="boss-desc">${boss.desc}</div>
                </div>
                <div>${actionHtml}</div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('boss-grid-container').innerHTML = html;
}

function startBossFight(index) {
    localStorage.setItem('hc_tourney_boss', index);
    window.location.href = 'index.html';
}

// --- NEW LEVEL COLORS FUNCTION ---
function getLevelColor(level) {
    if (level === 1) return '#9e9e9e'; // Grey (Common)
    if (level === 2) return '#4ade80'; // Green (Uncommon)
    if (level === 3) return '#60a5fa'; // Blue (Rare)
    if (level === 4) return '#c084fc'; // Purple (Epic)
    if (level === 5) return '#f87171'; // Red (Legendary)
    return '#fbbf24'; // Gold (MAX)
}

// --- PROFILE PAGE RENDERER ---
function renderProfilePage() {
    const usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    const stats = usersDB[currentUser];
   const cText = document.getElementById('prof-coins'); 
if (cText) cText.innerText = stats.coins;
    
    if (!stats) {
        return logoutUser();
    }
    
    document.getElementById('prof-username').innerText = currentUser;
    
    const rankData = applyRankUI(currentUser, 'prof-avatar-box');
    const rText = document.getElementById('prof-rank');
    
    if (rText) {
        rText.innerText = rankData.rank.title;
        rText.className = '';
        rText.classList.add(rankData.rank.class);
    }
    
    const xText = document.getElementById('prof-xp');
    if (xText) {
        xText.innerText = rankData.xp;
    }

    document.getElementById('prof-matches').innerText = stats.matches;
    document.getElementById('prof-wins').innerText = stats.wins;
    document.getElementById('prof-losses').innerText = stats.losses;
    document.getElementById('prof-ties').innerText = stats.ties;
    document.getElementById('prof-total-runs').innerText = stats.totalRuns;
    document.getElementById('prof-total-wickets').innerText = stats.totalWicketsTaken;
    document.getElementById('prof-hs').innerText = stats.highestScore;
    document.getElementById('prof-ducks').innerText = stats.ducks;
    
    let batAvg = "0.00";
    if (stats.matches > 0) {
        batAvg = (stats.totalRuns / stats.matches).toFixed(2);
    }
    document.getElementById('prof-bat-avg').innerText = batAvg;
    
    const wickets = stats.totalWicketsTaken || 0;
    let bowlAvg = "-";
    if (wickets > 0) {
        bowlAvg = (stats.totalRunsConceded / wickets).toFixed(2);
    }
    document.getElementById('prof-bowl-avg').innerText = bowlAvg;
    
    let avgSR = "0.00";
    if (stats.totalBallsFaced > 0) {
        avgSR = ((stats.totalRuns / stats.totalBallsFaced) * 100).toFixed(2);
    }
    
    const oversBowled = stats.totalBallsBowled / 6;
    let avgEco = "0.00";
    if (oversBowled > 0) {
        avgEco = (stats.totalRunsConceded / oversBowled).toFixed(2);
    }
    
    document.getElementById('prof-sr').innerText = avgSR;
    document.getElementById('prof-eco').innerText = avgEco;
    
    let bestSpellText = "-";
    if (stats.bestSpell && stats.bestSpell.wickets > 0) {
        bestSpellText = `${stats.bestSpell.wickets}/${stats.bestSpell.runs}`;
    }
    document.getElementById('prof-best-spell').innerText = bestSpellText;

    // BUILD DYNAMIC 5-TIER ACHIEVEMENTS
    const achievementList = [
        { id: 'veteran', icon: '🎖️', title: 'Veteran', desc: 'Play matches', thresholds: [50, 100, 250, 500, 1000], getVal: s => s.matches },
        { id: 'champion', icon: '🏆', title: 'Champion', desc: 'Win matches', thresholds: [20, 50, 150, 300, 500], getVal: s => s.wins },
        { id: 'runmachine', icon: '🚀', title: 'Run Machine', desc: 'Career runs', thresholds: [1000, 5000, 15000, 30000, 50000], getVal: s => s.totalRuns },
        { id: 'wickettaker', icon: '🎳', title: 'Wicket Taker', desc: 'Take wickets', thresholds: [50, 200, 500, 1000, 2000], getVal: s => s.totalWicketsTaken },
        { id: 'sixerking', icon: '👍', title: 'Sixer King', desc: 'Hit sixes', thresholds: [100, 500, 1000, 2500, 5000], getVal: s => s.careerSixes },
        { id: 'boundaryhitter', icon: '⚡', title: 'Boundary Hitter', desc: 'Hit fours', thresholds: [200, 1000, 2500, 5000, 10000], getVal: s => s.careerFours },
        { id: 'duckhunter', icon: '🦆', title: 'Duck Hunter', desc: 'AI Ducks', thresholds: [5, 25, 50, 100, 250], getVal: s => s.aiDucksGivens },
        { id: 'chaser', icon: '🏃', title: 'Chaser', desc: 'Winning chases', thresholds: [10, 50, 100, 250, 500], getVal: s => s.successfulChases },
        { id: 'luckycoin', icon: '🪙', title: 'Lucky Coin', desc: 'Win tosses', thresholds: [25, 100, 250, 500, 1000], getVal: s => s.tossesWon },
        { id: 'marathon', icon: '🥵', title: 'Marathon', desc: 'Face balls', thresholds: [500, 2500, 10000, 25000, 50000], getVal: s => s.totalBallsFaced },
        { id: 'unbreakable', icon: '🛡️', title: 'Unbreakable', desc: 'Not-Outs', thresholds: [10, 50, 100, 250, 500], getVal: s => s.notOutMatches },
        { id: 'economical', icon: '📉', title: 'Economical', desc: 'Bowl dot balls', thresholds: [100, 500, 2000, 5000, 10000], getVal: s => s.careerDotsBowled },
        { id: 'wall', icon: '🧱', title: 'The Wall', desc: 'Defend successfully', thresholds: [50, 200, 500, 1000, 2500], getVal: s => s.careerDefenses },
        { id: 'centurion', icon: '🏏', title: 'Centurion', desc: 'Score centuries', thresholds: [1, 10, 25, 50, 100], getVal: s => s.careerCenturies || 0 },
        { id: 'fiftymaker', icon: '💥', title: 'Fifty Maker', desc: 'Score half-centuries', thresholds: [5, 25, 50, 100, 250], getVal: s => s.careerFifties || 0 },
        { id: 'sniper', icon: '🎯', title: 'Sniper', desc: 'Wicket at 0 runs', thresholds: [5, 25, 50, 100, 250], getVal: s => s.careerSnipes || 0 }, 
        { id: 'boss_slayer', icon: '⚔️', title: 'Boss Slayer', desc: 'Defeat Bosses', thresholds: [5, 20, 50, 100, 250], getVal: s => s.bossesDefeated || 0 },
        { id: 'xp_farmer', icon: '🌟', title: 'XP Farmer', desc: 'Lifetime XP', thresholds: [5000, 25000, 100000, 250000, 1000000], getVal: s => s.xp || 0 },
        { id: 'loyalist', icon: '🕒', title: 'Loyalist', desc: 'Total balls bowled', thresholds: [500, 2500, 10000, 25000, 50000], getVal: s => s.totalBallsBowled },
        { id: 'bowling_machine', icon: '🦾', title: 'Bowling Machine', desc: 'Runs conceded', thresholds: [1000, 5000, 25000, 50000, 100000], getVal: s => s.totalRunsConceded },
        { id: 'giant_killer', icon: '👹', title: 'Giant Killer', desc: 'Beat Cricket God', thresholds: [1, 5, 10, 25, 50], getVal: s => s.godDefeats || 0 },
        { id: 'double_centurion', icon: '🚀', title: 'Double Centurion', desc: 'Score 200s', thresholds: [1, 5, 10, 25, 50], getVal: s => s.careerDoubleCenturies || 0 },
        { id: 'fifer', icon: '🔥', title: 'Five-for', desc: 'Take 5 wkts in match', thresholds: [1, 5, 10, 25, 50], getVal: s => s.fiveWicketHauls || 0 }
    ];

    let achHtml = '';
    
    achievementList.forEach(ach => {
        let val = ach.getVal(stats);
        let level = 1;
        let nextTarget = ach.thresholds[0];
        let isMaxed = false;
        
        for (let i = 0; i < ach.thresholds.length; i++) {
            if (val >= ach.thresholds[i]) {
                level = i + 2; 
            } else {
                nextTarget = ach.thresholds[i];
                break;
            }
        }
        
        if (level > ach.thresholds.length) {
            level = 'MAX';
            isMaxed = true;
            nextTarget = ach.thresholds[ach.thresholds.length - 1]; 
        }
        
        let prog = val > nextTarget ? nextTarget : val;
        let pct = (prog / nextTarget) * 100;
        
        if (isMaxed) {
            pct = 100;
        }

        // Apply Custom Colors Based on Level
        let color = getLevelColor(level);
        let borderStyle = `border: 2px solid ${color}; box-shadow: inset 0 0 10px ${color}40, 0 0 15px ${color}30; opacity: 1 !important; filter: none !important;`;

        achHtml += `
            <div class="badge" style="${borderStyle}">
                <div class="badge-icon">${ach.icon}</div>
                <div class="badge-title" style="color: white;">${ach.title}</div>
                <div class="badge-desc" style="color: var(--text-dim);">${ach.desc} <br> <span style="color:${color}; font-weight:bold;">${level === 'MAX' ? 'MAX LEVEL' : 'Lvl ' + level}</span></div>
                <div class="progress-container" style="background: rgba(255,255,255,0.1);">
                    <div class="progress-fill" style="width: ${pct}%; background: ${color}; box-shadow: 0 0 10px ${color};"></div>
                </div>
                <div class="progress-text" style="color: white;">${isMaxed ? 'MAXED OUT' : prog + ' / ' + nextTarget}</div>
            </div>
        `;
    });
    
    const achContainer = document.getElementById('achievements-grid-container');
    if (achContainer) {
        achContainer.innerHTML = achHtml;
    }

    // --- CHART.JS GENERATION ---
    if (srChartInstance) srChartInstance.destroy();
    if (runsChartInstance) runsChartInstance.destroy();
    if (throwDnaInstance) throwDnaInstance.destroy();
    if (fatalChartInstance) fatalChartInstance.destroy();

    const srCtxElement = document.getElementById('srLineChart');
    if (srCtxElement) {
        srChartInstance = new Chart(srCtxElement.getContext('2d'), {
            type: 'line', 
            data: { 
                labels: stats.last10SR ? stats.last10SR.map((_, i) => `M${i+1}`) : [], 
                datasets: [{ 
                    label: 'Strike Rate', 
                    data: stats.last10SR || [], 
                    borderColor: '#00ff88', 
                    backgroundColor: 'rgba(0,255,136,0.1)', 
                    borderWidth: 2, 
                    fill: true, 
                    tension: 0.3 
                }] 
            },
            options: { 
                plugins: { legend: { display: false } }, 
                scales: { 
                    y: { beginAtZero: true, grid: {color: 'rgba(255,255,255,0.1)'} }, 
                    x: { grid: {color: 'rgba(255,255,255,0.1)'} } 
                }, 
                color: '#fff' 
            }
        });
    }

    const runsCtxElement = document.getElementById('runsBarChart');
    if (runsCtxElement) {
        runsChartInstance = new Chart(runsCtxElement.getContext('2d'), {
            type: 'bar', 
            data: { 
                labels: stats.last20Innings ? stats.last20Innings.map((inn, i) => `Wkt ${i+1}${inn.notOut ? '*' : ''}`) : [], 
                datasets: [{ 
                    label: 'Runs Scored', 
                    data: stats.last20Innings ? stats.last20Innings.map(inn => inn.runs) : [], 
                    backgroundColor: '#00d2ff', 
                    borderRadius: 4 
                }] 
            },
            options: { 
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { 
                        callbacks: { 
                            title: function(c) { 
                                return c[0].label.includes('*') ? c[0].label + ' (Not Out)' : c[0].label; 
                            } 
                        } 
                    } 
                }, 
                scales: { 
                    y: { beginAtZero: true, grid: {color: 'rgba(255,255,255,0.1)'} }, 
                    x: { grid: {color: 'rgba(255,255,255,0.1)'}, ticks: { font: {size: 10} } } 
                }, 
                color: '#fff' 
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
                datasets: [{ 
                    label: 'Times Thrown', 
                    data: [t['1'], t['2'], t['3'], t['4'], t['5'], t['6'], t['0']], 
                    backgroundColor: 'rgba(0, 255, 136, 0.2)', 
                    borderColor: '#00ff88', 
                    pointBackgroundColor: '#fff', 
                    borderWidth: 2 
                }] 
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
                datasets: [{ 
                    label: 'Got Out On', 
                    data: [ft['1'], ft['2'], ft['3'], ft['4'], ft['5'], ft['6'], ft['0']], 
                    backgroundColor: 'rgba(255, 42, 42, 0.2)', 
                    borderColor: '#ff2a2a', 
                    pointBackgroundColor: '#fff', 
                    borderWidth: 2 
                }] 
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
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-tab');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active-content');
    });
    
    const eventObj = window.event;
    if (eventObj && eventObj.target) {
        eventObj.target.classList.add('active-tab');
    }
    
    const activeContent = document.getElementById(tabId);
    if (activeContent) {
        activeContent.classList.add('active-content');
    }
}

// --- VISUAL EFFECTS ---
function fireConfetti() {
    if (typeof confetti !== 'undefined') {
        var duration = 3000; 
        var end = Date.now() + duration;
        
        (function frame() {
            confetti({ 
                particleCount: 5, 
                angle: 60, 
                spread: 55, 
                origin: { x: 0 }, 
                colors: ['#00ff88', '#00d2ff'] 
            });
            confetti({ 
                particleCount: 5, 
                angle: 120, 
                spread: 55, 
                origin: { x: 1 }, 
                colors: ['#00ff88', '#00d2ff'] 
            });
            
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
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
    
    setTimeout(() => { 
        if (container.contains(toast)) {
            container.removeChild(toast); 
        }
    }, 5000);
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
        if (btn.id && btn.id.startsWith('btn-fmt')) {
            btn.classList.remove('active-setup-btn'); 
        }
    });
    
    const activeBtn = document.getElementById(btnId); 
    if (activeBtn) {
        activeBtn.classList.add('active-setup-btn');
    }
}

function setDifficulty(level, btnId) {
    gameState.aiDifficulty = level;
    
    document.querySelectorAll('.setup-btn').forEach(btn => { 
        if (btn.id && btn.id.startsWith('btn-diff')) {
            btn.classList.remove('active-setup-btn'); 
        }
    });
    
    const activeBtn = document.getElementById(btnId); 
    if (activeBtn) {
        activeBtn.classList.add('active-setup-btn');
    }
}

function goToToss() {
    if (setupScreen) {
        setupScreen.style.display = 'none';
    }
    
    if (tossScreen) {
        tossScreen.style.display = 'block';
    }
    
    let aiMode = gameState.aiDifficulty === 'hard' ? "PRO AI (Career Analysis Active)" : "CASUAL AI (Random)";
    let formatMode = gameState.maxBalls === Infinity ? "CLASSIC FORMAT" : `T${gameState.maxBalls/6} FORMAT`;
    
    gameState.commentaryHistory.push(`--- WELCOME TO THE ARENA | ${formatMode} | ${aiMode} ---`);

    document.getElementById('toss-result-screen').style.display = 'none';
    const coin = document.getElementById('coin');
    
    if (coin) {
        coin.style.transition = 'none';
        coin.style.transform = 'rotateY(0deg)';
    }
    
    tossData.caller = Math.random() < 0.5 ? 'player' : 'comp';
    
    const statusText = document.getElementById('toss-status-text');
    const pControls = document.getElementById('player-call-controls');
    const cControls = document.getElementById('comp-call-controls');

    if (tossData.caller === 'player') {
        statusText.innerHTML = "You won the chance to call! <br><span style='color: var(--accent-blue);'>Heads or Tails?</span>";
        pControls.style.display = 'flex';
        cControls.style.display = 'none';
    } else {
        tossData.call = Math.random() < 0.5 ? 'heads' : 'tails';
        statusText.innerHTML = `Computer is calling... <br><span style='color: var(--accent-red); text-transform: uppercase;'>${tossData.call}</span>`;
        pControls.style.display = 'none';
        cControls.style.display = 'flex';
    }
}

function callCoin(choice) {
    tossData.call = choice;
    document.getElementById('player-call-controls').style.display = 'none';
    document.getElementById('toss-status-text').innerHTML = `You called: <span style='color: var(--accent-blue); text-transform: uppercase;'>${choice}</span>`;
    executeCoinFlip();
}

function executeCoinFlip() {
    document.getElementById('comp-call-controls').style.display = 'none';
    const coin = document.getElementById('coin');
    
    setTimeout(() => {
        if(coin) {
            coin.style.transition = 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 0.99)';
        }
        
        tossData.result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        let rotateAmount = (tossData.result === 'heads') ? 1800 : 1980;
        
        if(coin) {
            coin.style.transform = `rotateY(${rotateAmount}deg)`;
        }
        
        setTimeout(processTossResult, 3200);
    }, 50);
}

function processTossResult() {
    const resultScreen = document.getElementById('toss-result-screen');
    
    if (resultScreen) {
        resultScreen.style.display = 'block';
    }
    
    const playerWins = (tossData.caller === 'player' && tossData.call === tossData.result) || 
                       (tossData.caller === 'comp' && tossData.call !== tossData.result);

    gameState.commentaryHistory.push(`🪙 TOSS: It's ${tossData.result.toUpperCase()}! ${playerWins ? 'You won the toss!' : 'Computer won the toss.'}`);

    if (playerWins && currentUser) {
        let uDB = JSON.parse(localStorage.getItem('hc_usersDB'));
        uDB[currentUser].tossesWon = (uDB[currentUser].tossesWon || 0) + 1;
        localStorage.setItem('hc_usersDB', JSON.stringify(uDB));
    }

    const winText = document.getElementById('toss-winner-text');
    const pDecision = document.getElementById('player-decision-box');
    const cDecision = document.getElementById('computer-decision-box');

    if (playerWins) {
        winText.innerText = "🎉 YOU WON THE TOSS!"; 
        winText.style.color = 'var(--accent-neon)'; 
        pDecision.style.display = 'block';
        cDecision.style.display = 'none';
    } else {
        winText.innerText = "🤖 COMPUTER WON THE TOSS!"; 
        winText.style.color = 'var(--accent-red)';
        pDecision.style.display = 'none';
        
        gameState.isPlayerBatting = Math.random() < 0.5 ? false : true;
        const compChoice = gameState.isPlayerBatting ? 'BOWL' : 'BAT';
        
        gameState.commentaryHistory.push(`🤖 Computer elected to ${compChoice} first.`);
        
        cDecision.innerHTML = `<p style="color: var(--text-bright); font-size: 1.2rem; margin-bottom: 15px;">Computer chooses to <b style="color: var(--accent-red);">${compChoice}</b> first.</p>
                               <button class="btn pulse-btn" style="font-size: 1.5rem;" onclick="continueToMatch()">Start Match ➡️</button>`;
        cDecision.style.display = 'block';
    }
}

function startMatch(playerOptsToBat) {
    gameState.isPlayerBatting = playerOptsToBat;
    gameState.commentaryHistory.push(`👤 You elected to ${playerOptsToBat ? 'BAT' : 'BOWL'} first.`);
    continueToMatch();
}

function continueToMatch() {
    if (tossScreen) {
        tossScreen.style.display = 'none';
    }
    
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
    
    const cLabel = document.querySelector('.computer-side .side-label');
    const cScoreLabel = document.querySelector('.computer-bg .score-label');
    
    if (gameState.isTournament) {
        const boss = bossInfo[gameState.currentBoss];
        if (cLabel) {
            cLabel.innerText = `${boss.icon} ${boss.name}`;
            cLabel.style.color = boss.color;
        }
        if (cScoreLabel) {
            cScoreLabel.innerText = `${boss.name} SCORE`;
            cScoreLabel.style.color = boss.color;
        }
    }
    
    const pScore = document.getElementById('player-hand-score'); 
    if (pScore) {
        pScore.innerText = gameState.playerStats.runs;
    }
    
    const pWkts = document.getElementById('player-hand-wickets'); 
    if (pWkts) {
        pWkts.innerText = gameState.playerStats.wicketsLost;
    }
    
    const pOvers = document.getElementById('player-overs'); 
    if (pOvers) {
        pOvers.innerText = ballsToOvers(gameState.playerStats.balls);
    }
    
    const cScore = document.getElementById('computer-hand-score'); 
    if (cScore) {
        cScore.innerText = gameState.compStats.runs;
    }
    
    const cWkts = document.getElementById('computer-hand-wickets'); 
    if (cWkts) {
        cWkts.innerText = gameState.compStats.wicketsLost;
    }
    
    const cOvers = document.getElementById('computer-overs'); 
    if (cOvers) {
        cOvers.innerText = ballsToOvers(gameState.compStats.balls);
    }

    const maxOversText = gameState.maxBalls === Infinity ? " (Unlimited)" : ` / ${gameState.maxBalls/6}.0`;
    
    const pMaxOvers = document.getElementById('player-max-overs'); 
    if (pMaxOvers) {
        pMaxOvers.innerText = maxOversText;
    }
    
    const cMaxOvers = document.getElementById('computer-max-overs'); 
    if (cMaxOvers) {
        cMaxOvers.innerText = maxOversText;
    }

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

// --- THE 10 BOSS AI ENGINES ---
function getBossThrow(bossIndex) {
    let isCompBatting = !gameState.isPlayerBatting;
    
    if (gameState.compConsecZeros >= 2) {
        return Math.floor(Math.random() * 6) + 1;
    }
    
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {}; 
    let stats = usersDB[currentUser] || {};
    
    let pMatchThrows = isCompBatting ? gameState.playerMatchBowling : gameState.playerMatchBatting;
    let pLifeThrows = isCompBatting ? (stats.bowlingThrows || {}) : (stats.battingThrows || {});
    
    let getLikely = (throwsObj) => {
        let maxT = '1';
        let maxV = -1;
        for (let k in throwsObj) { 
            if (throwsObj[k] > maxV) { 
                maxV = throwsObj[k]; 
                maxT = k; 
            } 
        }
        return parseInt(maxT);
    };

    let snipe = (target) => {
        if (isCompBatting) {
            let safe = Math.floor(Math.random() * 6) + 1;
            while(safe === target) {
                safe = Math.floor(Math.random() * 6) + 1;
            }
            return safe;
        } else { 
            return target; 
        }
    };

    switch (bossIndex) {
        case 0: // Rookie
            return Math.floor(Math.random() * 6) + 1;
            
        case 1: // Wall
            if (isCompBatting) { 
                const opts = [0, 0, 1, 1, 2, 2, 3, 4]; 
                return opts[Math.floor(Math.random() * opts.length)]; 
            } else { 
                const opts = [1, 2, 3, 4, 0]; 
                return opts[Math.floor(Math.random() * opts.length)]; 
            }
            
        case 2: // Slogger
            if (isCompBatting) { 
                const opts = [4, 4, 5, 5, 6, 6, 3]; 
                return opts[Math.floor(Math.random() * opts.length)]; 
            } else { 
                const opts = [4, 5, 6, 1, 2]; 
                return opts[Math.floor(Math.random() * opts.length)]; 
            }
            
        case 3: // Illusionist
            let lastT = gameState.playerHistory.length > 0 ? gameState.playerHistory[gameState.playerHistory.length - 1] : 3;
            let opp = 6 - lastT; 
            return Math.max(0, Math.min(6, opp));
            
        case 4: // Copycat
            if (gameState.playerHistory.length > 0) {
                return gameState.playerHistory[gameState.playerHistory.length - 1];
            }
            return Math.floor(Math.random() * 6) + 1;
            
        case 5: // Gambler
            if (Math.random() < 0.3) { 
                let currT = getLikely(pMatchThrows); 
                return snipe(currT); 
            }
            return Math.floor(Math.random() * 6) + 1;
            
        case 6: // Mathematician
            let hist = gameState.playerHistory.slice(-5);
            if (hist.length === 0) {
                return Math.floor(Math.random() * 6) + 1;
            }
            let avg = Math.round(hist.reduce((a,b)=>a+b,0) / hist.length);
            return snipe(avg);
            
        case 7: // Sniper
            let lifeLikely = getLikely(pLifeThrows);
            if (Math.random() < 0.6) {
                return snipe(lifeLikely);
            }
            return Math.floor(Math.random() * 6) + 1;
            
        case 8: // Grandmaster
            let matchLikely = getLikely(pMatchThrows);
            if (pMatchThrows[matchLikely] < 3) {
                return getComputerThrowFallback();
            }
            if (Math.random() < 0.8) {
                return snipe(matchLikely);
            }
            return Math.floor(Math.random() * 6) + 1;
            
        case 9: // Cricket God
            let mLike = getLikely(pMatchThrows);
            if (Math.random() < 0.9) {
                return snipe(mLike);
            }
            return Math.floor(Math.random() * 6) + 1;
            
        default:
            return Math.floor(Math.random() * 6) + 1;
    }
}

function getComputerThrowFallback() {
    let isCompBatting = !gameState.isPlayerBatting;
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {}; 
    let stats = usersDB[currentUser];
    
    if (!stats || !stats.battingThrows) {
        return Math.floor(Math.random() * 7);
    }

    if (!isCompBatting) { 
        let pBats = stats.battingThrows; 
        let likelyThrow = Object.keys(pBats).reduce((a, b) => pBats[a] > pBats[b] ? a : b); 
        
        if (Math.random() < 0.75) {
            return parseInt(likelyThrow);
        } else {
            return Math.floor(Math.random() * 7);
        }
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

function getComputerThrow() { 
    if (gameState.isTournament) {
        return getBossThrow(gameState.currentBoss); 
    }
    
    if (gameState.compConsecZeros >= 2) {
        return Math.floor(Math.random() * 6) + 1; 
    }
    
    if (gameState.aiDifficulty === 'easy' || !currentUser) {
        return Math.floor(Math.random() * 7); 
    }
    
    return getComputerThrowFallback(); 
}

function playHand(playerNum) {
    if (gameState.gameOver || gameState.isTransitioning) {
        return;
    }
    
    gameState.playerHistory.push(playerNum);

    if (gameState.isPlayerBatting) { 
        gameState.playerMatchBatting[playerNum] = (gameState.playerMatchBatting[playerNum] || 0) + 1; 
    } else { 
        gameState.playerMatchBowling[playerNum] = (gameState.playerMatchBowling[playerNum] || 0) + 1; 
    }

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
    
    if (navigator.vibrate) {
        navigator.vibrate([50]);
    }

    document.getElementById('player-hand').innerText = handEmojis[playerNum]; 
    document.getElementById('computer-hand').innerText = handEmojis[compNum];

    const batNum = gameState.isPlayerBatting ? playerNum : compNum; 
    const bowlNum = gameState.isPlayerBatting ? compNum : playerNum; 
    const currentBalls = (gameState.isPlayerBatting ? gameState.playerStats.balls : gameState.compStats.balls) + 1;
    
    gameState.commentaryHistory.push(`[Ball ${currentBalls}] Bowler threw ${bowlNum}, Batter threw ${batNum}`);

    if (gameState.isPlayerBatting && gameState.playerConsecZeros === 3) {
        handleWicket(0, 'HIT_WICKET');
    } else if (!gameState.isPlayerBatting && gameState.compConsecZeros === 3) {
        handleWicket(0, 'HIT_WICKET');
    } else if (playerNum === 0 && compNum === 0) {
        handleWicket(0, 'STUMPED'); 
    } else if (playerNum === compNum) {
        handleWicket(playerNum, 'CAUGHT/BOWLED');
    } else if ((gameState.isPlayerBatting && compNum === 0) || (!gameState.isPlayerBatting && playerNum === 0)) {
        handleWide(batNum);
    } else if ((gameState.isPlayerBatting && playerNum === 0) || (!gameState.isPlayerBatting && compNum === 0)) {
        handleDefense();
    } else {
        handleRuns(gameState.isPlayerBatting ? playerNum : compNum);
    }

    if (!gameState.isTransitioning && !gameState.gameOver) { 
        updateMatchUI(); 
        checkMatchState(); 
    }
}

function writeCommentary(text, triggerType = null) {
    let finalOutput = `> ${text}`;
    
    if (gameState.isTournament && triggerType && !gameState.gameOver) {
        const boss = bossInfo[gameState.currentBoss];
        if (boss.taunts && boss.taunts[triggerType]) {
            const taunt = getRandomCommentary(boss.taunts[triggerType]);
            finalOutput += `<br><span style="color: ${boss.color}; font-weight: bold; margin-top: 5px; display: inline-block;">[${boss.name}]: "${taunt}"</span>`;
        }
    }
    
    gameState.commentaryHistory.push(`↳ ${text}`); 
    commentaryBox.innerHTML = finalOutput; 
    commentaryBox.style.transform = 'scale(1.02)'; 
    
    setTimeout(() => { 
        commentaryBox.style.transform = 'scale(1)'; 
    }, 200);
}

function handleWicket(num, type) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    
    currentBatterStats.balls++; 
    currentBatterStats.wicketsLost++;
    
    if (!gameState.isPlayerBatting) {
        gameState.compStats.dots++; 
    }
    
    const batterName = gameState.isPlayerBatting ? "You" : "Computer";
    currentBatterStats.outOn = (type === 'HIT_WICKET') ? '0 (Hit Wkt)' : (type === 'STUMPED' ? '0 (Stumped)' : num);
    
    let outNum = (type === 'HIT_WICKET' || type === 'STUMPED') ? '0' : num.toString();
    currentBatterStats.dismissalHistory.push({ num: outNum, type: type });
    currentBatterStats.wicketRunsHistory.push({ runs: currentBatterStats.currentWicketRuns, notOut: false });
    
    currentBatterStats.currentWicketRuns = 0; 
    currentBatterStats.wormData.push({ ball: currentBatterStats.balls, runs: currentBatterStats.runs, wkt: true });

    let tType = gameState.isPlayerBatting ? "wkt" : null;
    let comment = "";
    
    if (type === 'STUMPED') {
        comment = getRandomCommentary(commentaryDB.wkt_stumped).replace("[BATTER]", batterName);
    } else if (type === 'HIT_WICKET') {
        comment = getRandomCommentary(commentaryDB.wkt_hit).replace("[BATTER]", batterName);
    } else {
        comment = getRandomCommentary(commentaryDB.wkt_bowled).replace("[BATTER]", batterName).replace("[NUM]", num);
    }
    
    writeCommentary(comment, tType);
    
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
    
    currentBatterStats.wormData[currentBatterStats.wormData.length - 1].runs = currentBatterStats.runs;

    const team = gameState.isPlayerBatting ? "You" : "Computer";
    
    let comment = getRandomCommentary(commentaryDB.wide)
        .replace("[NUM]", batterNum)
        .replace(/\[RUNS\]/g, runsToAdd)
        .replace(/\[TEAM\]/g, team);
        
    writeCommentary(comment, null);
    
    if (gameState.innings === 2 && currentBatterStats.runs >= gameState.target) {
        endGame(gameState.isPlayerBatting ? "PLAYER_WINS" : "COM_WINS");
    }
}

function handleDefense() {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    currentBatterStats.balls++; 
    
    if (!gameState.isPlayerBatting) {
        gameState.compStats.dots++;
    }
    
    currentBatterStats.wormData.push({ ball: currentBatterStats.balls, runs: currentBatterStats.runs, wkt: false });
    
    let comment = getRandomCommentary(commentaryDB.defend);
    writeCommentary(comment, null);

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

    let tType = null;
    if (!gameState.isPlayerBatting && runs === 6) {
        tType = "six";
    }
    
    let comment = "";
    if (runs === 4) { 
        currentBatterStats.fours++; 
        comment = getRandomCommentary(commentaryDB.run_4);
    } else if (runs === 6) { 
        currentBatterStats.sixes++; 
        comment = getRandomCommentary(commentaryDB.run_6);
    } else if (runs === 5) {
        comment = getRandomCommentary(commentaryDB.run_5);
    } else { 
        comment = getRandomCommentary(commentaryDB.run_1_3).replace(/\[RUNS\]/g, runs);
    }
    
    writeCommentary(comment, tType);

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
        
        writeCommentary(`${reason}! Target is ${gameState.target}. ${gameState.isPlayerBatting ? "Time to chase!" : "Defend this total!"}`, null); 
        
        document.getElementById('player-hand').innerText = '✊'; 
        document.getElementById('computer-hand').innerText = '✊'; 
        
        gameState.isTransitioning = false; 
        updateMatchUI(); 
    }, 2500);
}

function drawWormChart() {
    const ctxElement = document.getElementById('wormChart'); 
    
    if (!ctxElement) return;
    
    if (wormChartInstance) {
        wormChartInstance.destroy();
    }
    
    let maxB = Math.max(gameState.playerStats.balls, gameState.compStats.balls); 
    let labels = Array.from({length: maxB + 1}, (_, i) => i);
    
    let pData = Array(maxB + 1).fill(null); 
    let pRadii = Array(maxB + 1).fill(0);
    
    gameState.playerStats.wormData.forEach(d => { 
        pData[d.ball] = d.runs; 
        if (d.wkt) {
            pRadii[d.ball] = 5; 
        }
    });
    
    for (let i=1; i<=gameState.playerStats.balls; i++) { 
        if (pData[i] === null) {
            pData[i] = pData[i-1]; 
        }
    }
    
    let cData = Array(maxB + 1).fill(null); 
    let cRadii = Array(maxB + 1).fill(0);
    
    gameState.compStats.wormData.forEach(d => { 
        cData[d.ball] = d.runs; 
        if (d.wkt) {
            cRadii[d.ball] = 5; 
        }
    });
    
    for (let i=1; i<=gameState.compStats.balls; i++) { 
        if (cData[i] === null) {
            cData[i] = cData[i-1]; 
        }
    }
    
    wormChartInstance = new Chart(ctxElement.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: 'Your Score', 
                    data: pData, 
                    borderColor: '#00d2ff', 
                    backgroundColor: '#00d2ff', 
                    borderWidth: 3, 
                    pointRadius: pRadii, 
                    pointBackgroundColor: '#ff2a2a', 
                    tension: 0.1 
                },
                { 
                    label: 'COM Score', 
                    data: cData, 
                    borderColor: '#ff2a2a', 
                    backgroundColor: '#ff2a2a', 
                    borderWidth: 3, 
                    pointRadius: cRadii, 
                    pointBackgroundColor: '#fff', 
                    borderDash: [5, 5], 
                    tension: 0.1 
                }
            ]
        },
        options: { 
            plugins: { 
                legend: { labels: { color: '#fff' } } 
            }, 
            scales: { 
                y: { 
                    beginAtZero: true, 
                    grid: {color: 'rgba(255,255,255,0.1)'} 
                }, 
                x: { 
                    title: { display: true, text: 'Balls', color: '#a1a1aa' }, 
                    grid: {color: 'rgba(255,255,255,0.1)'} 
                } 
            }, 
            color: '#fff' 
        }
    });
}

function endGame(result) {
    gameState.gameOver = true; 
    actionArea.style.display = 'none'; 
    
    const endControls = document.getElementById('end-game-controls'); 
    endControls.style.display = 'flex'; 
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

    if (gameState.isTournament) {
        let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
        let stats = usersDB[currentUser];
        
        if (result === "PLAYER_WINS") {
            if (stats.tournamentLevel === gameState.currentBoss) {
                stats.tournamentLevel++; 
                localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
                setTimeout(() => {
                    showToast(`🏆 BOSS DEFEATED! Level ${stats.tournamentLevel} Unlocked!`);
                }, 1000);
            }
        }
        
        const playAgainBtn = endControls.querySelectorAll('button')[1];
        if (playAgainBtn) {
            playAgainBtn.innerText = "🔙 TO GAUNTLET";
            playAgainBtn.onclick = function() {
                localStorage.removeItem('hc_tourney_boss');
                window.location.href = 'tournament.html';
            };
        }
    }
}

function evaluateAchievements(stats) {
    if (!stats.achLevels) {
        stats.achLevels = {};
    }

    const achievementList = [
        { id: 'veteran', icon: '🎖️', title: 'Veteran', desc: 'Play matches', thresholds: [50, 100, 250, 500, 1000], getVal: s => s.matches },
        { id: 'champion', icon: '🏆', title: 'Champion', desc: 'Win matches', thresholds: [20, 50, 150, 300, 500], getVal: s => s.wins },
        { id: 'runmachine', icon: '🚀', title: 'Run Machine', desc: 'Career runs', thresholds: [1000, 5000, 15000, 30000, 50000], getVal: s => s.totalRuns },
        { id: 'wickettaker', icon: '🎳', title: 'Wicket Taker', desc: 'Take wickets', thresholds: [50, 200, 500, 1000, 2000], getVal: s => s.totalWicketsTaken },
        { id: 'sixerking', icon: '👍', title: 'Sixer King', desc: 'Hit sixes', thresholds: [100, 500, 1000, 2500, 5000], getVal: s => s.careerSixes },
        { id: 'boundaryhitter', icon: '⚡', title: 'Boundary Hitter', desc: 'Hit fours', thresholds: [200, 1000, 2500, 5000, 10000], getVal: s => s.careerFours },
        { id: 'duckhunter', icon: '🦆', title: 'Duck Hunter', desc: 'AI Ducks', thresholds: [5, 25, 50, 100, 250], getVal: s => s.aiDucksGivens },
        { id: 'chaser', icon: '🏃', title: 'Chaser', desc: 'Winning chases', thresholds: [10, 50, 100, 250, 500], getVal: s => s.successfulChases },
        { id: 'luckycoin', icon: '🪙', title: 'Lucky Coin', desc: 'Win tosses', thresholds: [25, 100, 250, 500, 1000], getVal: s => s.tossesWon },
        { id: 'marathon', icon: '🥵', title: 'Marathon', desc: 'Face balls', thresholds: [500, 2500, 10000, 25000, 50000], getVal: s => s.totalBallsFaced },
        { id: 'unbreakable', icon: '🛡️', title: 'Unbreakable', desc: 'Not-Outs', thresholds: [10, 50, 100, 250, 500], getVal: s => s.notOutMatches },
        { id: 'economical', icon: '📉', title: 'Economical', desc: 'Bowl dot balls', thresholds: [100, 500, 2000, 5000, 10000], getVal: s => s.careerDotsBowled },
        { id: 'wall', icon: '🧱', title: 'The Wall', desc: 'Defend successfully', thresholds: [50, 200, 500, 1000, 2500], getVal: s => s.careerDefenses },
        { id: 'centurion', icon: '🏏', title: 'Centurion', desc: 'Score centuries', thresholds: [1, 10, 25, 50, 100], getVal: s => s.careerCenturies || 0 },
        { id: 'fiftymaker', icon: '💥', title: 'Fifty Maker', desc: 'Score half-centuries', thresholds: [5, 25, 50, 100, 250], getVal: s => s.careerFifties || 0 },
        { id: 'sniper', icon: '🎯', title: 'Sniper', desc: 'Wicket at 0 runs', thresholds: [5, 25, 50, 100, 250], getVal: s => s.careerSnipes || 0 }, 
        { id: 'boss_slayer', icon: '⚔️', title: 'Boss Slayer', desc: 'Defeat Bosses', thresholds: [5, 20, 50, 100, 250], getVal: s => s.bossesDefeated || 0 },
        { id: 'xp_farmer', icon: '🌟', title: 'XP Farmer', desc: 'Lifetime XP', thresholds: [5000, 25000, 100000, 250000, 1000000], getVal: s => s.xp || 0 },
        { id: 'loyalist', icon: '🕒', title: 'Loyalist', desc: 'Total balls bowled', thresholds: [500, 2500, 10000, 25000, 50000], getVal: s => s.totalBallsBowled },
        { id: 'bowling_machine', icon: '🦾', title: 'Bowling Machine', desc: 'Runs conceded', thresholds: [1000, 5000, 25000, 50000, 100000], getVal: s => s.totalRunsConceded },
        { id: 'giant_killer', icon: '👹', title: 'Giant Killer', desc: 'Beat Cricket God', thresholds: [1, 5, 10, 25, 50], getVal: s => s.godDefeats || 0 },
        { id: 'double_centurion', icon: '🚀', title: 'Double Centurion', desc: 'Score 200s', thresholds: [1, 5, 10, 25, 50], getVal: s => s.careerDoubleCenturies || 0 },
        { id: 'fifer', icon: '🔥', title: 'Five-for', desc: 'Take 5 wkts in match', thresholds: [1, 5, 10, 25, 50], getVal: s => s.fiveWicketHauls || 0 }
    ];

    achievementList.forEach(ach => {
        let val = ach.getVal(stats);
        let level = 1;
        
        for (let i = 0; i < ach.thresholds.length; i++) {
            if (val >= ach.thresholds[i]) {
                level = i + 2; 
            } else {
                break;
            }
        }
        
        if (level > ach.thresholds.length + 1) {
            level = 'MAX';
        }
        
        let oldLvl = stats.achLevels[ach.id] || 1;
        
        if (level !== 'MAX' && level > oldLvl) {
            stats.achLevels[ach.id] = level;
            showToast(`🏆 LEVELED UP: ${ach.title} is now Level ${level}!`);
        } else if (level === 'MAX' && oldLvl !== 'MAX') {
            stats.achLevels[ach.id] = 'MAX';
            showToast(`🌟 MAXED OUT: ${ach.title} reached MAX Level!`);
        }
    });
}

function saveLifetimeStats(result) {
    if (!currentUser) return;
    
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {}; 
    let stats = usersDB[currentUser];
    
    let matchXP = 50; 
    
    if (result === "PLAYER_WINS") {
        matchXP += 100;
    }
    
    matchXP += gameState.playerStats.runs;
    matchXP += (gameState.compStats.wicketsLost * 10);
    
    stats.xp = (stats.xp || 0) + matchXP;
   let matchCoins = Math.floor(matchXP * 0.5);
stats.coins = (stats.coins || 0) + matchCoins;

    stats.matches += 1;
    
    if (result === "PLAYER_WINS") {
        stats.wins += 1; 
    } else if (result === "COM_WINS") {
        stats.losses += 1; 
    } else {
        stats.ties += 1;
    }
    
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

    if (!stats.last20Innings) {
        stats.last20Innings = []; 
    }

    if (gameState.playerStats.runs >= 50 && gameState.playerStats.runs < 100) {
        stats.careerFifties = (stats.careerFifties || 0) + 1;
    }
    if (gameState.playerStats.runs >= 100 && gameState.playerStats.runs < 200) {
        stats.careerCenturies = (stats.careerCenturies || 0) + 1;
    }
    if (gameState.playerStats.runs >= 200) {
        stats.careerDoubleCenturies = (stats.careerDoubleCenturies || 0) + 1;
    }
    if (gameState.compStats.wicketsLost >= 5) {
        stats.fiveWicketHauls = (stats.fiveWicketHauls || 0) + 1;
    }

    if (gameState.isTournament && result === "PLAYER_WINS") {
        stats.bossesDefeated = (stats.bossesDefeated || 0) + 1;
        if (gameState.currentBoss === 9) {
            stats.godDefeats = (stats.godDefeats || 0) + 1;
        }
    }

    stats.totalExtrasReceived = (stats.totalExtrasReceived || 0) + gameState.playerStats.extras;

    gameState.playerStats.dismissalHistory.forEach(d => { 
        stats.totalDismissals += 1; 
        stats.fatalThrows[d.num] = (stats.fatalThrows[d.num] || 0) + 1; 
    });
    
    if (gameState.compStats.runs === 0 && gameState.compStats.wicketsLost > 0) {
        stats.careerSnipes = (stats.careerSnipes || 0) + 1;
    }

    gameState.playerStats.wicketRunsHistory.forEach(w => { 
        if (w.runs === 0) { 
            stats.ducks += 1; 
        } 
        stats.last20Innings.push({ runs: w.runs, notOut: false }); 
    });
    
    // FIX FOR AI DUCKS: Check if any AI batter scored 0 before getting out
    gameState.compStats.wicketRunsHistory.forEach(w => {
        if (w.runs === 0) {
            stats.aiDucksGivens = (stats.aiDucksGivens || 0) + 1;
        }
    });
    
    if (gameState.playerStats.wicketsLost < gameState.maxWickets && gameState.playerStats.balls > 0) { 
        stats.notOutMatches += 1; 
        stats.last20Innings.push({ runs: gameState.playerStats.currentWicketRuns, notOut: true }); 
    }
    
    while (stats.last20Innings.length > 20) { 
        stats.last20Innings.shift(); 
    }

    stats.totalRunsConceded += gameState.compStats.runs; 
    stats.totalBallsBowled += gameState.compStats.balls;

    if (gameState.compStats.wicketsLost > 0) {
        let currentWkts = gameState.compStats.wicketsLost; 
        let currentRuns = gameState.compStats.runs;
        
        if (!stats.bestSpell) { 
            stats.bestSpell = { wickets: 0, runs: 0 }; 
        }
        
        if (currentWkts > stats.bestSpell.wickets || (currentWkts === stats.bestSpell.wickets && currentRuns < stats.bestSpell.runs) || (stats.bestSpell.wickets === 0 && stats.bestSpell.runs === 0)) { 
            stats.bestSpell = { wickets: currentWkts, runs: currentRuns }; 
        }
    }
    
    let pSR = gameState.playerStats.balls > 0 ? ((gameState.playerStats.runs / gameState.playerStats.balls) * 100).toFixed(2) : "0.00";
    
    if (!stats.last10SR) { 
        stats.last10SR = []; 
    } 
    
    stats.last10SR.push(parseFloat(pSR)); 
    
    if (stats.last10SR.length > 10) { 
        stats.last10SR.shift(); 
    }

    evaluateAchievements(stats);
    usersDB[currentUser] = stats; 
    localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
    
   showToast(⬆️ +${matchXP} XP | 🪙 +${matchCoins} Coins!);
}

function populateStats(prefix, bStats, wStats) {
    const rElement = document.getElementById(`${prefix}-runs`); 
    if (rElement) rElement.innerText = bStats.runs;
    
    const wElement = document.getElementById(`${prefix}-wickets`); 
    if (wElement) wElement.innerText = bStats.wicketsLost;
    
    const bElement = document.getElementById(`${prefix}-balls`); 
    if (bElement) bElement.innerText = bStats.balls;
    
    const srElement = document.getElementById(`${prefix}-sr`); 
    if (srElement) srElement.innerText = bStats.balls > 0 ? ((bStats.runs / bStats.balls) * 100).toFixed(2) : "0.00";
    
    const rrElement = document.getElementById(`${prefix}-rr`); 
    if (rrElement) rrElement.innerText = bStats.balls > 0 ? ((bStats.runs / (bStats.balls/6))).toFixed(2) : "0.00";
    
    const boundsElement = document.getElementById(`${prefix}-bounds`); 
    if (boundsElement) boundsElement.innerText = bStats.fours + bStats.sixes;
    
    const foursElement = document.getElementById(`${prefix}-4s`); 
    if (foursElement) foursElement.innerText = bStats.fours;
    
    const sixesElement = document.getElementById(`${prefix}-6s`); 
    if (sixesElement) sixesElement.innerText = bStats.sixes;
    
    const outElement = document.getElementById(`${prefix}-out`); 
    if (outElement) outElement.innerText = bStats.outOn; 
    
    const extrasElement = document.getElementById(`${prefix}-extras`); 
    if (extrasElement) extrasElement.innerText = bStats.extras;
    
    const oversBowled = wStats.balls / 6; 
    const ecoElement = document.getElementById(`${prefix}-eco`); 
    if (ecoElement) ecoElement.innerText = oversBowled > 0 ? (wStats.runs / oversBowled).toFixed(2) : "0.00";
}

function generateAIInsight(result) {
    const insightBox = document.getElementById('ai-insight-text'); 
    if (!insightBox) return;
    
    if (gameState.isTournament) {
        insightBox.innerText = `Boss Fight Completed. ${result === 'PLAYER_WINS' ? 'You mastered their technique!' : 'Analyze their unique Throw DNA and try again.'}`;
    } else if (gameState.aiDifficulty === 'hard') {
        insightBox.innerText = "Pro AI Engine Active: The computer analyzed your entire career throw history to predict your moves. Keep randomizing!";
    } else {
        insightBox.innerText = "Casual Match Completed. Try increasing the AI difficulty to 'Pro' to see how well the computer can read your mind!";
    }
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
        
        if (innEl) {
            innStatusText = innEl.innerText.replace(/[🏏⚔️🏆💀🤝]/g, '').trim();
        }

        const wormCanvas = document.getElementById('wormChart');
        let wormImgHtml = '';
        
        if (wormCanvas) {
            try {
                const wormDataUrl = wormCanvas.toDataURL('image/png', 1.0);
                wormImgHtml = `
                    <div style="page-break-inside: avoid; text-align: center; margin-top: 30px; margin-bottom: 30px;">
                        <h3 style="color: #000000; font-size: 18px; border-bottom: 2px solid #000000; padding-bottom: 10px; font-weight: 900;">MATCH WORM CHART</h3>
                        <img src="${wormDataUrl}" style="width: 100%; max-width: 600px; height: auto; border: 2px solid #000; border-radius: 8px;">
                    </div>
                `;
            } catch (e) {
                console.log("Could not generate worm chart image", e);
            }
        }

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

                <table style="width: 100%; border-collapse: separate; border-spacing: 20px 0; margin-bottom: 30px; page-break-inside: avoid;">
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
                
                ${wormImgHtml}
                
                <div style="page-break-before: auto;">
                    <h3 style="color: #000000; font-size: 20px; font-weight: 900; border-bottom: 4px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">BALL-BY-BALL MATCH LOG</h3>
                    <table style="width: 100%; border-collapse: collapse; font-family: 'Courier New', Courier, monospace; font-size: 15px; line-height: 1.6; color: #000000; page-break-inside: auto;">
                        <tbody>
        `;

        let currentGroup = '';
        
        gameState.commentaryHistory.forEach(log => {
            let safeText = log.replace(/[🪙🤖👤💥🏏🎯🧤😱↔️🙅‍♂️😬🎁🛡️🧱🛑👀🔥⚡🤌🚀🛸🤯🏃🏃‍♂️🚨🤦‍♂️😲🪵🏆💀🤝👍]/g, '').trim();
            safeText = safeText.replace('↳', '>').trim();
            
            let lineStyle = "margin: 4px 0; color: #000000; font-weight: 700;";
            
            if (safeText.includes("WICKET") || safeText.includes("STUMPED") || safeText.includes("HOWZAT") || safeText.includes("HIT WICKET")) {
                lineStyle = "margin: 4px 0; color: #b91c1c; font-weight: 900;";
            } else if (safeText.includes("+4") || safeText.includes("+6")) {
                lineStyle = "margin: 4px 0; color: #1d4ed8; font-weight: 900;";
            } else if (safeText.includes("---")) {
                lineStyle = "margin: 15px 0 5px 0; padding: 10px; background: #e5e7eb; border: 3px solid #000000; text-align: center; font-weight: 900; font-size: 16px;";
            }

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
        
        if (currentGroup !== '') {
            pdfHTML += `<tr style="page-break-inside: avoid; page-break-after: auto;">
                            <td style="border-left: 4px solid #000000; padding-left: 15px; padding-bottom: 15px; border-bottom: 1px dashed #d1d5db;">${currentGroup}</td>
                        </tr>`;
        }

        pdfHTML += `
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 50px; text-align: center; color: #000000; font-size: 14px; font-weight: 900; border-top: 3px solid #000000; padding-top: 20px; page-break-inside: avoid;">
                    Generated by Hand Clash Arena &bull; &copy; 2026
                </div>
            </div>`;

        printElement.innerHTML = pdfHTML;

        const opt = {
            margin: 0.4, 
            filename: 'Hand_Clash_Match_Report.pdf', 
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true }, 
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: 'css', avoid: 'tr' } 
        };

        html2pdf().set(opt).from(printElement).save().then(() => {
            btn.innerHTML = originalText; 
            btn.disabled = false; 
        }).catch(err => {
            console.error("PDF engine promise caught an error:", err);
            btn.innerHTML = "❌ PDF ERROR";
            
            setTimeout(() => {
                btn.innerHTML = originalText; 
                btn.disabled = false; 
            }, 3000);
        });

    } catch(err) {
        console.error("DOM access failed before PDF generation:", err);
        btn.innerHTML = "❌ SYSTEM ERROR";
        
        setTimeout(() => {
            btn.innerHTML = originalText; 
            btn.disabled = false; 
        }, 3000);
    }
}

function logoutUser() {
    if (confirm("Are you sure you want to log out and switch accounts?")) {
        localStorage.removeItem('hc_currentUser');
        window.location.href = 'index.html';
    }
}

function resetGauntlet() {
    if (!currentUser) return;
    
    if (confirm("🚨 WARNING: Are you sure you want to restart The Gauntlet? All your defeated bosses will be locked again!")) {
        let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
        if (usersDB[currentUser]) {
            usersDB[currentUser].tournamentLevel = 0;
            localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
            renderTournamentPage();
            showToast("🔄 The Gauntlet has been restarted!");
        }
    }
}
// ==========================================
// SHOP & COSMETICS ENGINE
// ==========================================
const shopItems = {
    avatars: [
        { id: '👤', name: 'Default', price: 0 }, { id: '🐯', name: 'Tiger', price: 500 },
        { id: '👽', name: 'Alien', price: 1000 }, { id: '🤖', name: 'Robot', price: 1500 },
        { id: '👑', name: 'King', price: 3000 }
    ],
    themes: [
        { id: 'default', name: 'Cyber Green', price: 0, icon: '🟩' },
        { id: 'synthwave', name: 'Synthwave', price: 1500, icon: '🟪' },
        { id: 'blood', name: 'Blood Red', price: 2000, icon: '🟥' }
    ],
    coins: [
        { id: 'default', name: 'Gold Coin', price: 0, icon: '🟡' },
        { id: 'silver', name: 'Silver Coin', price: 1000, icon: '⚪' },
        { id: 'bitcoin', name: 'Crypto Coin', price: 2500, icon: '₿' }
    ]
};

function renderShop() {
    let u = JSON.parse(localStorage.getItem('hc_usersDB'))[currentUser];
    const buildSection = (items, typeStr, unlockedArr, equippedId) => {
        let html = '';
        items.forEach(item => {
            let isUnlocked = unlockedArr.includes(item.id);
            let isEquipped = equippedId === item.id;
            let btnHtml = '';
            if (isEquipped) { btnHtml = `<button class="shop-btn equipped" disabled>EQUIPPED</button>`; } 
            else if (isUnlocked) { btnHtml = `<button class="shop-btn equip" onclick="equipItem('${typeStr}', '${item.id}')">EQUIP</button>`; } 
            else {
                let canAfford = u.coins >= item.price;
                btnHtml = `<button class="shop-btn buy" ${!canAfford ? 'disabled' : ''} onclick="buyItem('${typeStr}', '${item.id}', ${item.price})">🪙 ${item.price}</button>`;
            }
            html += `<div class="shop-item ${isEquipped ? 'equipped' : ''}"><div class="shop-item-icon">${item.icon || item.id}</div><div class="shop-item-name">${item.name}</div>${btnHtml}</div>`;
        });
        return html;
    };
    document.getElementById('shop-avatars').innerHTML = buildSection(shopItems.avatars, 'avatar', u.unlockedAvatars, u.equippedAvatar);
    document.getElementById('shop-themes').innerHTML = buildSection(shopItems.themes, 'theme', u.unlockedThemes, u.equippedTheme);
    document.getElementById('shop-coins').innerHTML = buildSection(shopItems.coins, 'coin', u.unlockedCoins, u.equippedCoin);
}

function buyItem(type, itemId, price) {
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); let u = usersDB[currentUser];
    if (u.coins >= price) {
        u.coins -= price;
        if (type === 'avatar') u.unlockedAvatars.push(itemId);
        if (type === 'theme') u.unlockedThemes.push(itemId);
        if (type === 'coin') u.unlockedCoins.push(itemId);
        localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
        showToast(`🛍️ Successfully Purchased!`);
        document.getElementById('prof-coins').innerText = u.coins;
        renderShop();
    }
}

function equipItem(type, itemId) {
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); let u = usersDB[currentUser];
    if (type === 'avatar') u.equippedAvatar = itemId;
    if (type === 'theme') u.equippedTheme = itemId;
    if (type === 'coin') u.equippedCoin = itemId;
    localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
    applyCosmetics(); renderShop();
}

function applyCosmetics() {
    if (!currentUser) return;
    let u = JSON.parse(localStorage.getItem('hc_usersDB'))[currentUser];
    document.body.classList.remove('theme-synthwave', 'theme-blood');
    if (u.equippedTheme !== 'default') document.body.classList.add('theme-' + u.equippedTheme);
    let headerAv = document.getElementById('avatar-text'); if(headerAv) headerAv.innerText = u.equippedAvatar;
    let profAv = document.getElementById('prof-avatar-letter'); if(profAv) profAv.innerText = u.equippedAvatar;
    let coinHeads = document.querySelector('.coin-heads'); let coinTails = document.querySelector('.coin-tails');
    if (coinHeads && coinTails) {
        coinHeads.className = 'coin-face coin-heads'; coinTails.className = 'coin-face coin-tails';
        if (u.equippedCoin !== 'default') { coinHeads.classList.add('coin-' + u.equippedCoin); coinTails.classList.add('coin-' + u.equippedCoin); }
        if (u.equippedCoin === 'bitcoin') { coinHeads.innerHTML = '₿'; coinTails.innerHTML = '₿'; } else { coinHeads.innerHTML = 'HEADS'; coinTails.innerHTML = 'TAILS'; }
    }
}
