/* =========================================================
   CRICPULSE FUN-GUN ARENA | ULTIMATE STATS & AI ENGINE
   ========================================================= */

// ==========================================
// 1. GAME STATE & DATABASES
// ==========================================

let gameState = {
   matchActive: false,
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

// 10-BOSS GAUNTLET DATABASE
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

// SHOP DATABASE
const shopItems = {
    avatars: [
        { id: '👤', name: 'Default', price: 0 },
        { id: '🐯', name: 'Tiger', price: 499 },
        { id: '👽', name: 'Alien', price: 999 },
        { id: '🤖', name: 'Robot', price: 1499 },
        { id: '🤫', name: 'Silencer', price: 1999 },
        { id: '👑', name: 'King', price: 2999 }
    ],
    themes: [
        { id: 'default', name: 'Cyber Green', price: 0, icon: '🟩' },
        { id: 'synthwave', name: 'Synthwave', price: 1499, icon: '🟪' },
        { id: 'blood', name: 'Blood Red', price: 1999, icon: '🟥' }
    ],
   coins: [
        { id: 'default', name: 'Lead Coin', price: 0, icon: '🪙' }, 
        { id: 'copper', name: 'Copper Coin', price: 2499, icon: '🟤' },
        { id: 'silver', name: 'Silver Coin', price: 4999, icon: '⚪' }, 
        { id: 'gold', name: 'Gold Coin', price: 7499, icon: '🟡' },
      { id: 'dollar', name: 'Dollar Coin', price: 9999, icon: '💲' },
        { id: 'bitcoin', name: 'Crypto Coin', price: 12499, icon: '₿' }, 
        { id: 'diamond', name: 'Diamond Coin', price: 15999, icon: '💎' }
    ]
};

let tossData = { caller: null, call: null, result: null };
let currentUser = null;
let srChartInstance = null;
let runsChartInstance = null;
let throwDnaInstance = null;
let fatalChartInstance = null;
let wormChartInstance = null;
let outcomesChartInstance = null;
let runsBreakdownChartInstance = null;

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

// ==========================================
// 2. INITIALIZATION & DATA MANAGEMENT
// ==========================================

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
           bindPfpUpload();
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
    
    if (!u.bestSpell) u.bestSpell = { wickets: 0, runs: 0 };
    if (!u.battingThrows) u.battingThrows = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    if (!u.bowlingThrows) u.bowlingThrows = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    if (!u.fatalThrows) u.fatalThrows = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    
    u.careerDefenses = u.careerDefenses || 0;
    u.careerSixes = u.careerSixes || 0;
    u.careerFours = u.careerFours || 0;
    u.careerFives = u.careerFives || 0;
    u.aiDucksGivens = u.aiDucksGivens || 0;
    u.successfulChases = u.successfulChases || 0;
    u.tossesWon = u.tossesWon || 0;
    u.notOutMatches = u.notOutMatches || 0;
    u.careerDotsBowled = u.careerDotsBowled || 0;
    u.xp = u.xp || 0;
    u.tournamentLevel = u.tournamentLevel || 0;

    if (u.coins === undefined) u.coins = Math.floor((u.xp || 0) * 0.5);
    
    u.unlockedAvatars = u.unlockedAvatars || ['👤']; 
    u.unlockedThemes = u.unlockedThemes || ['default']; 
    u.unlockedCoins = u.unlockedCoins || ['default'];
    u.equippedAvatar = u.equippedAvatar || '👤'; 
    u.equippedTheme = u.equippedTheme || 'default'; 
    u.equippedCoin = u.equippedCoin || 'default';
    if (!u.achLevels) u.achLevels = {};

    // --- ZERO MIGRATION: Wipe old data, start fresh ---
    delete u.last10SR;
    delete u.last20Innings;
    
    if (!u.last60SR) u.last60SR = [];
    if (!u.last35Innings) u.last35Innings = [];
    
    u.highestScoreNotOut = u.highestScoreNotOut || false; 
    u.customPFP = u.customPFP || null;
    
    localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
}
function toggleHeaderButtons(mode) {
    const backBtn = document.getElementById('header-back-btn');
    const forfeitBtn = document.getElementById('header-forfeit-btn');
    const profileBtn = document.getElementById('user-profile-btn'); // Grab the profile button
    
    if (!backBtn || !forfeitBtn) return;

    if (mode === 'setup') {
        // Main Menu: Show QUIT and PROFILE
        backBtn.style.display = 'block';
        backBtn.innerText = 'QUIT';
        backBtn.onclick = exitGameTab; 
        forfeitBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'flex';
        
    } else if (mode === 'toss') {
        // Toss Screen: Show BACK, hide PROFILE so they focus on the game
        backBtn.style.display = 'block';
        backBtn.innerText = 'BACK';
        backBtn.onclick = quitMatch;
        forfeitBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        
    } else if (mode === 'match') {
        // Active Match: Show FORFEIT, hide PROFILE
        backBtn.style.display = 'none';
        forfeitBtn.style.display = 'block';
        if (profileBtn) profileBtn.style.display = 'none';
        
    } else if (mode === 'end') {
        // Game Over: Hide forfeit/back, bring PROFILE back
        backBtn.style.display = 'none';
        forfeitBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'flex';
    }
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
    applyCosmetics();
   toggleHeaderButtons('setup');
    
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

function logoutUser() {
    if (confirm("Are you sure you want to log out and switch accounts?")) {
        localStorage.removeItem('hc_currentUser');
        window.location.href = 'index.html';
    }
}
function bindPfpUpload() {
    let profBox = document.getElementById('prof-avatar-box');
    if (profBox) {
        const PFP_COST = 500000; 
        
        profBox.style.cursor = 'pointer'; 
        profBox.title = `Click to Upload Custom Profile Picture (Costs 🪙 ${PFP_COST.toLocaleString()})`;
        
        profBox.onclick = () => {
            let usersDB = JSON.parse(localStorage.getItem('hc_usersDB'));
            let userStats = usersDB[currentUser];
            
            // Replaced ugly alert with sleek Toast
            if (userStats.coins < PFP_COST) {
                showToast(`❌ Not enough coins! You need 🪙 ${PFP_COST.toLocaleString()}`);
                return; 
            }
            
            // Call our new custom sleek modal
            showConfirmModal(
                "CUSTOM AVATAR", 
                `Uploading a custom Profile Picture costs 🪙 ${PFP_COST.toLocaleString()}. Do you want to proceed?`, 
                () => {
                    // This runs ONLY if they click "YES"
                    let input = document.createElement('input'); 
                    input.type = 'file'; 
                    input.accept = 'image/*';
                    
                    input.onchange = e => {
                        let file = e.target.files[0]; 
                        let reader = new FileReader();
                        
                        reader.onload = event => {
                            let db = JSON.parse(localStorage.getItem('hc_usersDB'));
                            
                            db[currentUser].coins -= PFP_COST;
                            db[currentUser].customPFP = event.target.result;
                            localStorage.setItem('hc_usersDB', JSON.stringify(db));
                            
                            applyCosmetics(); 
                            const cText = document.getElementById('prof-coins');
                            if (cText) {
                                cText.innerText = db[currentUser].coins.toLocaleString();
                            }
                            
                            showToast(`🖼️ Custom PFP Updated! (-🪙${PFP_COST.toLocaleString()})`);
                        };
                        
                        if (file) reader.readAsDataURL(file);
                    };
                    
                    input.click();
                }
            );
        };
    }
}
// ==========================================
// 3. UI, SHOP & COSMETICS
// ==========================================


function applyCosmetics() {
    if (!currentUser) return;
    
    let u = JSON.parse(localStorage.getItem('hc_usersDB'))[currentUser];
    
    document.body.classList.remove('theme-synthwave', 'theme-blood');
    if (u.equippedTheme !== 'default') {
        document.body.classList.add('theme-' + u.equippedTheme);
    }
    
   let headerAv = document.getElementById('avatar-text'); 
    let profAv = document.getElementById('prof-avatar-letter'); 
    
    const displayAvatar = (el) => {
        if (!el) return;
        if (u.customPFP) {
            el.innerHTML = `<img src="${u.customPFP}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            el.innerText = u.equippedAvatar;
        }
    };
    
    displayAvatar(headerAv); 
    displayAvatar(profAv);
    
    let coinHeads = document.querySelector('.coin-heads'); 
    let coinTails = document.querySelector('.coin-tails');
    
    if (coinHeads && coinTails) {
        coinHeads.className = 'coin-face coin-heads'; 
        coinTails.className = 'coin-face coin-tails';
        
        if (u.equippedCoin !== 'default') {
            coinHeads.classList.add('coin-' + u.equippedCoin); 
            coinTails.classList.add('coin-' + u.equippedCoin); 
        }
        
        if (u.equippedCoin === 'bitcoin') {
            coinHeads.innerHTML = '₿'; 
            coinTails.innerHTML = '₿'; 
        } else {
            coinHeads.innerHTML = 'HEADS'; 
            coinTails.innerHTML = 'TAILS'; 
        }
    }
}

function renderShop() {
    let u = JSON.parse(localStorage.getItem('hc_usersDB'))[currentUser];
    
    const buildSection = (items, typeStr, unlockedArr, equippedId) => {
        let html = '';
        
        items.forEach(item => {
            let isUnlocked = unlockedArr.includes(item.id);
            let isEquipped = equippedId === item.id;
            let btnHtml = '';
            
            if (isEquipped) {
                btnHtml = `<button class="shop-btn equipped" disabled>EQUIPPED</button>`;
            } else if (isUnlocked) {
                btnHtml = `<button class="shop-btn equip" onclick="equipItem('${typeStr}', '${item.id}')">EQUIP</button>`;
            } else {
                let canAfford = u.coins >= item.price;
                let disabledStr = !canAfford ? 'disabled' : '';
                btnHtml = `<button class="shop-btn buy" ${disabledStr} onclick="buyItem('${typeStr}', '${item.id}', ${item.price})">🪙 ${item.price}</button>`;
            }
            
            let equipClass = isEquipped ? 'equipped' : '';
            let iconDisplay = item.icon || item.id;
            
            html += `
                <div class="shop-item ${equipClass}">
                    <div class="shop-item-icon">${iconDisplay}</div>
                    <div class="shop-item-name">${item.name}</div>
                    ${btnHtml}
                </div>
            `;
        });
        
        return html;
    };
    
    const avatarsContainer = document.getElementById('shop-avatars');
    if (avatarsContainer) {
        avatarsContainer.innerHTML = buildSection(shopItems.avatars, 'avatar', u.unlockedAvatars, u.equippedAvatar);
    }
    
    const themesContainer = document.getElementById('shop-themes');
    if (themesContainer) {
        themesContainer.innerHTML = buildSection(shopItems.themes, 'theme', u.unlockedThemes, u.equippedTheme);
    }
    
    const coinsContainer = document.getElementById('shop-coins');
    if (coinsContainer) {
        coinsContainer.innerHTML = buildSection(shopItems.coins, 'coin', u.unlockedCoins, u.equippedCoin);
    }
}

function buyItem(type, itemId, price) {
    // Call our new custom sleek modal
    showConfirmModal(
        "CONFIRM PURCHASE", 
        `Are you sure you want to spend 🪙 ${price.toLocaleString()} on this item?`, 
        () => {
            // This runs ONLY if they click "YES"
            let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
            let u = usersDB[currentUser];
            
            if (u.coins >= price) {
                u.coins -= price;
                
                if (type === 'avatar') u.unlockedAvatars.push(itemId);
                if (type === 'theme') u.unlockedThemes.push(itemId);
                if (type === 'coin') u.unlockedCoins.push(itemId);
                
                localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
                showToast(`🛍️ Successfully Purchased!`);
                
                const cText = document.getElementById('prof-coins');
                if (cText) {
                    cText.innerText = u.coins.toLocaleString();
                }
                
                renderShop();
            }
        }
    );
}

function equipItem(type, itemId) {
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
    let u = usersDB[currentUser];
    
    if (type === 'avatar') u.equippedAvatar = itemId;
    if (type === 'theme') u.equippedTheme = itemId;
    if (type === 'coin') u.equippedCoin = itemId;
    
    localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
    
    applyCosmetics(); 
    renderShop();
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

function goToProfile() {
    window.location.href = 'profile.html';
}

function getRankDetails(xp) {
    // TIER 1 to TIER 7 Progression System
    if (xp < 1000)   return { title: 'Tier 1: Gully Cricketer', class: 'rank-gully' };
    if (xp < 3000)   return { title: 'Tier 2: Club Player',     class: 'rank-club' };
    if (xp < 7000)   return { title: 'Tier 3: State Pro',       class: 'rank-state' };
    if (xp < 15000)  return { title: 'Tier 4: National Star',   class: 'rank-national' };
    if (xp < 35000)  return { title: 'Tier 5: World Champion',  class: 'rank-world' };
    if (xp < 100000) return { title: 'Tier 6: Cricket God',   class: 'rank-legend' };
    
    // MAX TIER
    return { title: 'Tier 7: Mythical Master', class: 'rank-god' };
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

function getLevelColor(level) {
    if (level === 1) return '#9e9e9e'; // Grey
    if (level === 2) return '#4ade80'; // Green
    if (level === 3) return '#60a5fa'; // Blue
    if (level === 4) return '#c084fc'; // Purple
    if (level === 5) return '#f87171'; // Red
    return '#fbbf24'; // Gold (MAX)
}

// ==========================================
// 4. TOURNAMENT & PROFILE RENDERING
// ==========================================

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

function renderProfilePage() {
    const usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    const stats = usersDB[currentUser];
    
    if (!stats) {
        return logoutUser();
    }
    
    const cText = document.getElementById('prof-coins'); 
    if (cText) {
        cText.innerText = stats.coins;
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
   document.getElementById('prof-hs').innerText = stats.highestScore + (stats.highestScoreNotOut ? '*' : '');
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

   // CHARTS GENERATION

    if (srChartInstance) srChartInstance.destroy();
    if (runsChartInstance) runsChartInstance.destroy();
    if (throwDnaInstance) throwDnaInstance.destroy();
    if (fatalChartInstance) fatalChartInstance.destroy();
    if (outcomesChartInstance) outcomesChartInstance.destroy(); // <--- ADD THIS
    if (runsBreakdownChartInstance) runsBreakdownChartInstance.destroy(); // <--- ADD THIS

    const srCtxElement = document.getElementById('srLineChart');
    if (srCtxElement) {
        srChartInstance = new Chart(srCtxElement.getContext('2d'), {
            type: 'line', 
            data: { 
                // CHANGED: Now looks for last60SR
                labels: stats.last60SR ? stats.last60SR.map((_, i) => `M${i+1}`) : [], 
                datasets: [{ 
                    label: 'Strike Rate', 
                    // CHANGED: Now pulls data from last60SR
                    data: stats.last60SR || [], 
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
                    // Optional: hide x-axis labels if 60 matches looks too crowded
                    x: { grid: {color: 'rgba(255,255,255,0.1)'}, ticks: { display: false } } 
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
                labels: stats.last35Innings ? stats.last35Innings.map((inn, i) => `Wkt ${i+1}${inn.notOut ? '*' : ''}`) : [], 
                datasets: [{ 
                    label: 'Runs Scored', 
                    data: stats.last35Innings ? stats.last35Innings.map(inn => inn.runs) : [], 
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
   // 5. Match Outcomes Chart (Doughnut)
    const outcomesCtx = document.getElementById('outcomesChart');
    if (outcomesCtx) {
        outcomesChartInstance = new Chart(outcomesCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Wins', 'Losses', 'Ties'],
                datasets: [{
                    data: [stats.wins || 0, stats.losses || 0, stats.ties || 0],
                    backgroundColor: ['#00d2ff', '#ff2a2a', '#a1a1aa'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                plugins: { legend: { position: 'bottom', labels: { color: '#fff', font: { family: "'Rajdhani', sans-serif", size: 14 } } } },
                color: '#fff'
            }
        });
    }

    // 6. Career Runs Breakdown Chart (Pie)

    const breakdownCtx = document.getElementById('runsBreakdownChart');
    if (breakdownCtx) {
        let bound4s = (stats.careerFours || 0) * 4;
        let bound6s = (stats.careerSixes || 0) * 6;
        
        
        let runRuns = (stats.totalRuns || 0) - (bound4s + bound6s );
        if (runRuns < 0) runRuns = 0; 

        runsBreakdownChartInstance = new Chart(breakdownCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Running (1s, 2s, 3s and 5s)', 'Runs from 4s', 'Runs from 6s'],
                datasets: [{
                    data: [runRuns, bound4s, bound6s],
                    backgroundColor: ['#facc15', '#00ff88', '#9333ea'], // Added orange for 5s
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                plugins: { legend: { position: 'bottom', labels: { color: '#fff', font: { family: "'Rajdhani', sans-serif", size: 14 } } } },
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

// ==========================================
// 5. GAME SETUP & TOSS
// ==========================================

// Variable to temporarily remember what the user clicked while the modal is open
let pendingFormat = { balls: 30, btnId: '' };

function setFormat(wickets, balls, btnId) {
    pendingFormat = { balls: balls, btnId: btnId };
    
    const modal = document.getElementById('wicket-modal');
    const title = document.getElementById('wicket-modal-title');
    const btnContainer = document.getElementById('wicket-btn-container');
    
    if (!modal) return;
    
    btnContainer.innerHTML = ''; // Clear old buttons
    let maxWicketsAllowed = 5;
    
    // Dynamic logic based on the format chosen
    if (balls === 30) {
        title.innerText = "T5 FORMAT";
        maxWicketsAllowed = 3; // T5 allows 1 to 3 wickets
    } else if (balls === 60) {
        title.innerText = "T10 FORMAT";
        maxWicketsAllowed = 5; // T10 allows 1 to 5 wickets
    } else if (balls === Infinity) {
        title.innerText = "CLASSIC MODE";
        maxWicketsAllowed = 5; // Classic allows 1 to 5 wickets
    } else {
        title.innerText = "CUSTOM FORMAT";
        maxWicketsAllowed = wickets || 5;
    }

    // Generate the nice circular buttons
    for (let i = 1; i <= maxWicketsAllowed; i++) {
        const btn = document.createElement('button');
        btn.className = 'setup-btn';
        btn.style.width = '60px';
        btn.style.height = '60px';
        btn.style.padding = '0';
        btn.style.fontSize = '1.5rem';
        btn.style.borderRadius = '50%';
        btn.style.display = 'flex';
        btn.style.justifyContent = 'center';
        btn.style.alignItems = 'center';
        btn.innerText = i;
        
        btn.onclick = () => confirmFormat(i);
        btnContainer.appendChild(btn);
    }
    
    // Show the popup
    modal.style.display = 'flex';
}

function confirmFormat(selectedWickets) {
    // Save the choices to the game state
    gameState.maxWickets = selectedWickets;
    gameState.maxBalls = pendingFormat.balls;
    
    // Remove glow from all format buttons
    document.querySelectorAll('.setup-btn').forEach(btn => { 
        if (btn.id && btn.id.startsWith('btn-fmt')) {
            btn.classList.remove('active-setup-btn'); 
        }
    });
    
    // Add glow to the chosen format button
    const activeBtn = document.getElementById(pendingFormat.btnId); 
    if (activeBtn) activeBtn.classList.add('active-setup-btn');
    
    // Special rule for Classic mode
    if (pendingFormat.balls === Infinity) {
        setDifficulty('easy', 'btn-diff-easy'); // Force Easy AI for unlimited
        showToast(`Classic Mode: ${selectedWickets} Wkts, Easy AI!`);
    } else {
        showToast(`${pendingFormat.balls / 6} Overs | ${selectedWickets} Wickets Set!`);
    }
    
    closeWicketModal();
}

function closeWicketModal() {
    const modal = document.getElementById('wicket-modal');
    if (modal) modal.style.display = 'none';
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
    // 1. Update the Header Buttons
    toggleHeaderButtons('toss');

    // 2. Switch Screens
    if (setupScreen) setupScreen.style.display = 'none';
    if (tossScreen) {
        tossScreen.style.display = 'block';
        // Ensure the coin container itself is visible
        const coinContainer = document.querySelector('.coin-container');
        if (coinContainer) coinContainer.style.display = 'block';
    }
    
    // 3. Reset the Coin position
    const coin = document.getElementById('coin');
    if (coin) {
        coin.style.transition = 'none';
        coin.style.transform = 'rotateY(0deg)';
    }

    // 4. Set up the Caller logic
    tossData.caller = Math.random() < 0.5 ? 'player' : 'comp';
    
    const statusText = document.getElementById('toss-status-text');
    const pControls = document.getElementById('player-call-controls');
    const cControls = document.getElementById('comp-call-controls');

    // Reset visibility of step 1 (calling) and hide step 2 (result)
    document.getElementById('toss-step-1').style.display = 'block';
    document.getElementById('toss-result-screen').style.display = 'none';

    if (tossData.caller === 'player') {
        statusText.innerHTML = "You won the chance to call! <br><span class='dynamic-theme-text'>Heads or Tails?</span>";
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
        if (coin) {
            coin.style.transition = 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 0.99)';
        }
        
        tossData.result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        let rotateAmount = (tossData.result === 'heads') ? 1800 : 1980;
        
        if (coin) {
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
   gameState.matchActive = true;
   toggleHeaderButtons('match');
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

// ==========================================
// 6. CORE GAMEPLAY & MATCH AI LOGIC
// ==========================================

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
function getRandomCommentary(arr) { 
    return arr[Math.floor(Math.random() * arr.length)]; 
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
        currentBatterStats.fives = (currentBatterStats.fives || 0) + 1; // <--- ADDED TRACKER
        comment = getRandomCommentary(commentaryDB.run_5);
    } else { 
        comment = getRandomCommentary(commentaryDB.run_1_3).replace(/\[RUNS\]/g, runs);
    }
    
    writeCommentary(comment, tType);

    if (gameState.isPlayerBatting && currentBatterStats.runs >= 100 && !currentBatterStats.hitCentury) { 
        currentBatterStats.hitCentury = true; 
        fireConfetti(); 
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

// ==========================================
// 7. POST MATCH & ANALYTICS
// ==========================================

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
   toggleHeaderButtons('end');
    gameState.gameOver = true; 
    actionArea.style.display = 'none'; 
    
    const endControls = document.getElementById('end-game-controls'); 
    if (endControls) endControls.style.display = 'flex'; 
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
    
    // CRITICAL: Calculate and save stats FIRST
    saveLifetimeStats(result);

    populateStats('an-p', gameState.playerStats, gameState.compStats); 
    populateStats('an-c', gameState.compStats, gameState.playerStats);

   
    // Populate Match Rewards UI (XP and Coins)
    const xpDisplay = document.getElementById('gain-xp');
    const coinDisplay = document.getElementById('gain-coins');
    const gains = gameState.lastMatchGains || { xp: 0, coins: 0 };
    if (xpDisplay && coinDisplay) {
        xpDisplay.style.color = gains.xp >= 1000 ? "var(--accent-blue)" : "white";
        xpDisplay.innerText = `+${gains.xp.toLocaleString()} XP`;
        coinDisplay.innerText = `+${gains.coins.toLocaleString()} Coins`;
    }

    generateAIInsight(result); 

    // Handle Tournament Progress
    if (gameState.isTournament) {
        let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
        let stats = usersDB[currentUser];
        if (result === "PLAYER_WINS" && stats.tournamentLevel === gameState.currentBoss) {
            stats.tournamentLevel++; 
            localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
            setTimeout(() => { showToast(`🏆 BOSS DEFEATED! Level ${stats.tournamentLevel} Unlocked!`); }, 1000);
        }
        
        if (endControls) {
            const returnBtn = endControls.querySelectorAll('button')[2];
            if (returnBtn) {
                returnBtn.innerText = "🔙 TO GAUNTLET";
                returnBtn.onclick = function() { localStorage.removeItem('hc_tourney_boss'); window.location.href = 'tournament.html'; };
            }
        }
    }
}
function saveLifetimeStats(result) {
    if (!currentUser) return;
    
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {}; 
    let stats = usersDB[currentUser];
    
    let matchXP = 0;
    let matchCoins = 0;

    if (result === "FORFEIT") {
        // THE 200 XP PENALTY
        matchXP = -200;
    } else {
        // NORMAL MATCH XP CALCULATION
        matchXP = 100; 
        if (result === "PLAYER_WINS") matchXP += 100000;
        
        matchXP += gameState.playerStats.runs;
        matchXP += (gameState.compStats.wicketsLost * 10);
        
        let bossBonusXP = 0;
        if (gameState.isTournament && result === "PLAYER_WINS") {
            stats.bossesDefeated = (stats.bossesDefeated || 0) + 1;
            if (gameState.currentBoss === 9 || gameState.currentBoss === 13) stats.godDefeats = (stats.godDefeats || 0) + 1;
            
            if (gameState.currentBoss <= 2) bossBonusXP = 1000;
            else if (gameState.currentBoss <= 5) bossBonusXP = 2500;
            else if (gameState.currentBoss <= 8) bossBonusXP = 10000;
            else if (gameState.currentBoss <= 13) bossBonusXP = 100000;
        }
        
        matchXP += bossBonusXP;
        matchCoins = Math.floor(matchXP * 0.5);
    }
    
    // Apply XP (using Math.max so it never drops below 0)
    stats.xp = Math.max(0, (stats.xp || 0) + matchXP);
    stats.coins = (stats.coins || 0) + matchCoins;
    gameState.lastMatchGains = { xp: matchXP, coins: matchCoins };

    stats.matches += 1;
    
    // A forfeit counts as a loss
    if (result === "PLAYER_WINS") stats.wins += 1; 
    else if (result === "COM_WINS" || result === "FORFEIT") stats.losses += 1; 
    else stats.ties += 1;
    
    stats.totalRuns += gameState.playerStats.runs; 
    stats.totalBallsFaced += gameState.playerStats.balls;
    stats.careerSixes += gameState.playerStats.sixes; 
    stats.careerFours += gameState.playerStats.fours;
    stats.careerFives = (stats.careerFives || 0) + (gameState.playerStats.fives || 0);
    stats.careerDotsBowled += gameState.compStats.dots; 
    
    if (gameState.playerStats.runs > stats.highestScore) {
        stats.highestScore = gameState.playerStats.runs;
        stats.highestScoreNotOut = (gameState.playerStats.wicketsLost < gameState.maxWickets);
    }
    
    if (result === "PLAYER_WINS" && gameState.innings === 2 && gameState.isPlayerBatting) stats.successfulChases += 1;

    if (gameState.playerStats.runs >= 50 && gameState.playerStats.runs < 100) stats.careerFifties = (stats.careerFifties || 0) + 1;
    if (gameState.playerStats.runs >= 100 && gameState.playerStats.runs < 200) stats.careerCenturies = (stats.careerCenturies || 0) + 1;
    if (gameState.playerStats.runs >= 200) stats.careerDoubleCenturies = (stats.careerDoubleCenturies || 0) + 1;
    if (gameState.compStats.wicketsLost >= 5) stats.fiveWicketHauls = (stats.fiveWicketHauls || 0) + 1;
    stats.totalExtrasReceived = (stats.totalExtrasReceived || 0) + gameState.playerStats.extras;

    gameState.playerStats.dismissalHistory.forEach(d => { 
        stats.totalDismissals += 1; 
        stats.fatalThrows[d.num] = (stats.fatalThrows[d.num] || 0) + 1; 
    });
    
    if (gameState.compStats.runs === 0 && gameState.compStats.wicketsLost > 0) stats.careerSnipes = (stats.careerSnipes || 0) + 1;

    if (!stats.last35Innings) stats.last35Innings = [];
    gameState.playerStats.wicketRunsHistory.forEach(w => { 
        if (w.runs === 0) stats.ducks += 1; 
        stats.last35Innings.push({ runs: w.runs, notOut: false }); 
    });
    
    gameState.compStats.wicketRunsHistory.forEach(w => {
        if (w.runs === 0) stats.aiDucksGivens = (stats.aiDucksGivens || 0) + 1;
    });
    
    if (gameState.playerStats.wicketsLost < gameState.maxWickets && gameState.playerStats.balls > 0) { 
        if (result !== "FORFEIT") stats.notOutMatches += 1; 
        stats.last35Innings.push({ runs: gameState.playerStats.currentWicketRuns, notOut: true }); 
    }
    while (stats.last35Innings.length > 35) { stats.last35Innings.shift(); }

    stats.totalRunsConceded += gameState.compStats.runs; 
    stats.totalBallsBowled += gameState.compStats.balls;

    if (gameState.compStats.wicketsLost > 0) {
        let currentWkts = gameState.compStats.wicketsLost; 
        let currentRuns = gameState.compStats.runs;
        if (!stats.bestSpell) stats.bestSpell = { wickets: 0, runs: 0 }; 
        if (currentWkts > stats.bestSpell.wickets || (currentWkts === stats.bestSpell.wickets && currentRuns < stats.bestSpell.runs) || (stats.bestSpell.wickets === 0 && stats.bestSpell.runs === 0)) { 
            stats.bestSpell = { wickets: currentWkts, runs: currentRuns }; 
        }
    }
    
    if (!stats.last60SR) stats.last60SR = [];
    let pSR = gameState.playerStats.balls > 0 ? ((gameState.playerStats.runs / gameState.playerStats.balls) * 100).toFixed(2) : "0.00";
    stats.last60SR.push(parseFloat(pSR)); 
    while (stats.last60SR.length > 60) { stats.last60SR.shift(); }

    evaluateAchievements(stats);
    usersDB[currentUser] = stats; 
    localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
    
    // TOAST NOTIFICATION UPDATE
    if (result === "FORFEIT") {
        showToast(`⚠️ Match Forfeited. Stats Saved | 200 XP Deducted.`);
    } else {
        showToast(`⬆️ +${matchXP} XP | 🪙 +${matchCoins} Coins!`);
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

    // ==========================================
    // NEW ADVANCED METRICS 
    // ==========================================
    
    let boundRuns = (bStats.fours * 4) + (bStats.sixes * 6);
    let totalBounds = bStats.fours + bStats.sixes;
    let runningRuns = bStats.runs - boundRuns;
    let nonBoundBalls = bStats.balls - totalBounds;

    // Boundary Percentage (%)
    const bpctElement = document.getElementById(`${prefix}-bpct`);
    if (bpctElement) {
        bpctElement.innerText = bStats.runs > 0 ? ((boundRuns / bStats.runs) * 100).toFixed(2) : "0.00";
    }

    // Running Runs (1s, 2s, 3s, 5s)
    const runrunsElement = document.getElementById(`${prefix}-runruns`);
    if (runrunsElement) {
        runrunsElement.innerText = runningRuns;
    }

    // Balls per Boundary
    const bpbElement = document.getElementById(`${prefix}-bpb`);
    if (bpbElement) {
        bpbElement.innerText = totalBounds > 0 ? (bStats.balls / totalBounds).toFixed(1) : "0.0";
    }

    // Non-Boundary Strike Rate
    const nbsrElement = document.getElementById(`${prefix}-nbsr`);
    if (nbsrElement) {
        nbsrElement.innerText = nonBoundBalls > 0 ? ((runningRuns / nonBoundBalls) * 100).toFixed(2) : "0.00";
    }
}

function generateAIInsight(result) {
    const insightBox = document.getElementById('ai-insight-text'); if (!insightBox) return;
    
    let pSR = gameState.playerStats.balls > 0 ? (gameState.playerStats.runs / gameState.playerStats.balls) * 100 : 0;
    let dots = gameState.playerStats.balls - (gameState.playerStats.fours + gameState.playerStats.sixes + gameState.playerStats.runs);
    
    let insight = "";
    if (gameState.isTournament) {
        insight = result === 'PLAYER_WINS' ? "[GAUNTLET] Exceptional pattern disruption. You broke the boss's core algorithm." : "[GAUNTLET] You fell into their targeted DNA trap. Review your Throw DNA graph before retrying.";
    } else if (gameState.aiDifficulty === 'hard') {
        if (pSR > 200) insight = "[PRO AI] Your aggressive variance overwhelmed the neural net. Keep swinging!";
        else if (dots > 10) insight = "[PRO AI] Too many dot balls. The AI recognized your defensive setup and locked you down.";
        else insight = "[PRO AI] A tightly contested match. The AI analyzed your lifetime frequencies but you managed to stay unpredictable.";
    } else {
        if (gameState.playerStats.wicketsLost === 0) insight = "[CASUAL] Clinical execution. Zero dismissals indicates perfect shot selection.";
        else if (pSR < 100) insight = "[CASUAL] Strike rate under 100. Focus on finding gaps rather than pure defense.";
        else insight = "[CASUAL] Solid casual performance. Ready to test your true skills against the Pro AI engine?";
    }
    insightBox.innerText = insight;
}
function resetToToss() { 
    localStorage.removeItem('hc_tourney_boss'); 
    location.reload(); 
}

function openAnalysis() { 
    const modal = document.getElementById('analysis-modal');
    if (modal) {
        modal.style.display = 'flex'; 
        drawWormChart(); 
    }
}

function closeAnalysis() { 
    const modal = document.getElementById('analysis-modal');
    if (modal) {
        modal.style.display = 'none'; 
    }
}
function downloadPDF() {
    const btn = document.getElementById('pdf-btn'); 
    if (!btn) return;
    
    const originalText = btn.innerHTML; 
    btn.innerHTML = "⏳ GENERATING REPORT..."; 
    btn.disabled = true;

    try {
        if (typeof html2pdf === 'undefined') throw new Error("PDF Engine currently loading. Please wait a moment.");

        const pStats = gameState.playerStats;
        const cStats = gameState.compStats;

        let pBoundRuns = (pStats.fours * 4) + (pStats.sixes * 6);
        let pTotalBounds = pStats.fours + pStats.sixes;
        let pRunningRuns = pStats.runs - pBoundRuns;
        let pBpct = pStats.runs > 0 ? ((pBoundRuns / pStats.runs) * 100).toFixed(2) : "0.00";
        let pRR = pStats.balls > 0 ? ((pStats.runs / (pStats.balls/6))).toFixed(2) : "0.00";
        let pSR = pStats.balls > 0 ? ((pStats.runs / pStats.balls) * 100).toFixed(2) : "0.00";
        let pEco = cStats.balls > 0 ? (cStats.runs / (cStats.balls / 6)).toFixed(2) : "0.00";

        let cBoundRuns = (cStats.fours * 4) + (cStats.sixes * 6);
        let cTotalBounds = cStats.fours + cStats.sixes;
        let cRunningRuns = cStats.runs - cBoundRuns;
        let cBpct = cStats.runs > 0 ? ((cBoundRuns / cStats.runs) * 100).toFixed(2) : "0.00";
        let cRR = cStats.balls > 0 ? ((cStats.runs / (cStats.balls/6))).toFixed(2) : "0.00";
        let cSR = cStats.balls > 0 ? ((cStats.runs / cStats.balls) * 100).toFixed(2) : "0.00";
        let cEco = pStats.balls > 0 ? (pStats.runs / (pStats.balls / 6)).toFixed(2) : "0.00";

        let innStatusText = "MATCH REPORT";
        const innEl = document.getElementById('innings-status');
        if (innEl) innStatusText = innEl.innerText.replace(/[🏏⚔️🏆💀🤝]/g, '').trim();

        const wormCanvas = document.getElementById('wormChart');
        let wormImgHtml = '';
        if (wormCanvas) {
            try {
                const wormDataUrl = wormCanvas.toDataURL('image/png', 1.0);
                wormImgHtml = `
                    <div style="text-align: center; margin-top: 40px;">
                        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">MATCH WORM CHART</h1>
                        <p style="color: #666; font-size: 14px; margin-bottom: 30px;">Visual progression of runs per ball</p>
                        <img src="${wormDataUrl}" style="width: 100%; max-width: 650px; border: 2px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 10px; background: #fff;">
                    </div>
                `;
            } catch (e) { console.log("Could not generate worm chart image", e); }
        }

        let pdfHTML = `
            <div style="width: 800px; padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; background: #fff; box-sizing: border-box;">
                
                <div style="text-align: center; border-bottom: 4px solid #111; padding-bottom: 15px; margin-bottom: 30px;">
                    <h1 style="font-size: 36px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 2px;">HAND CLASH</h1>
                    <h2 style="font-size: 14px; font-weight: 600; color: #555; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">OFFICIAL MATCH REPORT</h2>
                </div>

                <div style="text-align: center; background: #f8f9fa; padding: 20px; border: 2px solid #222; border-left: 8px solid #3b82f6; border-radius: 4px; margin-bottom: 35px;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 800; color: #222;">${innStatusText}</h3>
                </div>

                <table style="width: 100%; border-collapse: separate; border-spacing: 25px 0; margin-bottom: 30px;">
                    <tr>
                        <td style="width: 50%; vertical-align: top; padding: 25px; border: 2px solid #e5e7eb; border-top: 6px solid #3b82f6; border-radius: 6px; background: #fafafa; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; color: #111;">👤 YOUR PERFORMANCE</h3>
                            <table style="width: 100%; font-size: 14px; line-height: 2;">
                                <tr><td style="color:#555;">Runs / Wickets</td><td style="text-align: right; font-weight: bold; font-size: 16px;">${pStats.runs} <span style="color:#ef4444;">/ ${pStats.wicketsLost}</span></td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Balls Faced</td><td style="text-align: right; font-weight: bold;">${pStats.balls}</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Strike Rate</td><td style="text-align: right; font-weight: bold;">${pSR}</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Run Rate</td><td style="text-align: right; font-weight: bold;">${pRR}</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Boundaries</td><td style="text-align: right; font-weight: bold;">${pTotalBounds} <span style="font-size: 12px; color:#888;">(${pStats.fours}x4 / ${pStats.sixes}x6)</span></td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Boundary %</td><td style="text-align: right; font-weight: bold;">${pBpct}%</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Running Runs</td><td style="text-align: right; font-weight: bold;">${pRunningRuns}</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Bowling Eco</td><td style="text-align: right; font-weight: bold;">${pEco}</td></tr>
                            </table>
                        </td>
                        <td style="width: 50%; vertical-align: top; padding: 25px; border: 2px solid #e5e7eb; border-top: 6px solid #ef4444; border-radius: 6px; background: #fafafa; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; color: #111;">🤖 COM PERFORMANCE</h3>
                            <table style="width: 100%; font-size: 14px; line-height: 2;">
                                <tr><td style="color:#555;">Runs / Wickets</td><td style="text-align: right; font-weight: bold; font-size: 16px;">${cStats.runs} <span style="color:#ef4444;">/ ${cStats.wicketsLost}</span></td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Balls Faced</td><td style="text-align: right; font-weight: bold;">${cStats.balls}</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Strike Rate</td><td style="text-align: right; font-weight: bold;">${cSR}</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Run Rate</td><td style="text-align: right; font-weight: bold;">${cRR}</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Boundaries</td><td style="text-align: right; font-weight: bold;">${cTotalBounds} <span style="font-size: 12px; color:#888;">(${cStats.fours}x4 / ${cStats.sixes}x6)</span></td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Boundary %</td><td style="text-align: right; font-weight: bold;">${cBpct}%</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Running Runs</td><td style="text-align: right; font-weight: bold;">${cRunningRuns}</td></tr>
                                <tr style="border-top: 1px dashed #e5e7eb;"><td style="color:#555;">Bowling Eco</td><td style="text-align: right; font-weight: bold;">${cEco}</td></tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <div class="html2pdf__page-break"></div>
                
                ${wormImgHtml}

                <div class="html2pdf__page-break"></div>
                
                <div style="margin-top: 30px;">
                    <h3 style="color: #111; font-size: 20px; font-weight: 800; border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 20px; text-transform: uppercase;">BALL-BY-BALL MATCH LOG</h3>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
        `;

        gameState.commentaryHistory.forEach(log => {
            let safeText = log.replace(/[🪙🤖👤💥🏏🎯🧤😱↔️🙅‍♂️😬🎁🛡️🧱🛑👀🔥⚡🤌🚀🛸🤯🏃🏃‍♂️🚨🤦‍♂️😲🪵🏆💀🤝👍]/g, '').trim();
            safeText = safeText.replace('↳', '>').trim();
            
            let color = "#333", fontWeight = "normal", bgColor = "#fff", padding = "8px 12px", borderBottom = "1px solid #e5e7eb";

            const upperText = safeText.toUpperCase();
            const wicketKeywords = ["WICKET", "STUMPED", "HOWZAT", "OUT!", "TIMBER!", "BOWLED!", "DEPARTS!", "SHATTERS", "CASTLED!"];
            
            if (wicketKeywords.some(kw => upperText.includes(kw))) {
                color = "#dc2626"; fontWeight = "bold"; bgColor = "#fef2f2";
            } else if (safeText.includes("+4") || safeText.includes("+6")) {
                color = "#2563eb"; fontWeight = "bold"; bgColor = "#eff6ff";
            } else if (safeText.includes("---")) {
                bgColor = "#f3f4f6"; borderBottom = "2px solid #d1d5db"; padding = "12px"; fontWeight = "800"; color = "#111";
            }

            pdfHTML += `<div style="color: ${color}; font-weight: ${fontWeight}; background: ${bgColor}; padding: ${padding}; border-bottom: ${borderBottom};">${safeText}</div>`;
        });

        pdfHTML += `
                    </div>
                </div>
            </div>`;

        const opt = {
            margin:       0.4,
            filename:     'Hand_Clash_Match_Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: 'css' }
        };

        html2pdf().set(opt).from(pdfHTML).save().then(() => {
            btn.innerHTML = originalText; 
            btn.disabled = false; 
        }).catch(err => {
            console.error("PDF engine promise caught an error:", err);
            btn.innerHTML = "❌ PDF ERROR";
            setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
        });

    } catch(err) {
        console.error("PDF generation failed:", err);
        btn.innerHTML = "❌ SYSTEM ERROR";
        setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
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
// --- UNIVERSAL CONFIRMATION MODAL LOGIC ---
let pendingConfirmAction = null;

function showConfirmModal(title, desc, onConfirm) {
    const modal = document.getElementById('custom-confirm-modal');
    if (!modal) return;
    
    document.getElementById('confirm-modal-title').innerText = title;
    document.getElementById('confirm-modal-desc').innerText = desc;
    
    pendingConfirmAction = onConfirm;
    
    document.getElementById('confirm-modal-yes').onclick = () => {
        if (pendingConfirmAction) pendingConfirmAction();
        closeConfirmModal();
    };
    
    modal.style.display = 'flex';
}

function closeConfirmModal() {
    const modal = document.getElementById('custom-confirm-modal');
    if (modal) modal.style.display = 'none';
    pendingConfirmAction = null;
}
function exitGameTab() {
    // 1. Show the sleek confirmation modal first
    showConfirmModal(
        "EXIT ARENA", 
        "Are you sure you want to leave the game?", 
        () => {
            // 2. This runs ONLY if they click "YES"
            
            // Attempt to close the browser tab natively
            window.close();
            
            // If the browser blocks it, show the sleek info modal
            setTimeout(() => {
                const infoModal = document.getElementById('custom-info-modal');
                
                if (infoModal) {
                    // Update the text and show the modal
                    document.getElementById('info-modal-title').innerText = "CANNOT AUTO-EXIT";
                    document.getElementById('info-modal-desc').innerText = "Please close this tab manually. Your browser is blocking auto-exit for security reasons.";
                    infoModal.style.display = 'flex';
                } else {
                    // Ultimate fallback just in case the HTML isn't loaded
                    alert("Please close this tab manually. Your browser is blocking auto-exit.");
                }
                
            }, 300);
        }
    );
}
function quitMatch() {
   const matchStarted = gameState.matchActive === true;

    if (!matchStarted) {
        // PRE-TOSS: Free exit, no stats saved, no penalty
        showConfirmModal(
            "CANCEL MATCH", 
            "Are you sure you want to go back? (No stats affected, no penalty)", 
            () => {
                executeForfeit(false);
            }
        );
    } else {
        // POST-TOSS: Save stats, deduct 200 XP
        showConfirmModal(
            "FORFEIT MATCH", 
            "Are you sure you want to forfeit? Your runs will be saved, but you will LOSE 200 XP.", 
            () => {
                executeForfeit(true);
            }
        );
    }
}
function executeForfeit(applyPenalty) {
    // 1. IF MIDWAY THROUGH MATCH, SAVE STATS WITH NO XP
    if (applyPenalty && currentUser) {
        // We pass "FORFEIT" into the stat saver so it knows to give 0 XP
        saveLifetimeStats("FORFEIT");
    } else {
        showToast("Match Cancelled safely.");
    }

    // 2. HIDE ALL ACTIVE SCREENS
    const screensToHide = ['toss-screen', 'game-screen', 'post-match-screen'];
    screensToHide.forEach(id => {
        let el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // 3. SHOW THE SETUP SCREEN
    toggleHeaderButtons('setup');

    const setupScreen = document.getElementById('setup-screen');
    if (setupScreen) setupScreen.style.display = 'block';
  
    // 4. WIPE THE GAME STATE CLEAN
    gameState.isPlayerBatting = null;
   gameState.matchActive = false;
    gameState.tossChoice = null;
    gameState.innings = 1;
    gameState.gameOver = false;
    gameState.commentaryHistory = [];
    
    gameState.playerStats = { 
        runs: 0, balls: 0, fours: 0, sixes: 0, extras: 0, wicketsLost: 0, 
        dismissalHistory: [], wicketRunsHistory: [], wormData: [{ ball: 0, runs: 0, wkt: false }] 
    };
    gameState.compStats = { 
        runs: 0, balls: 0, fours: 0, sixes: 0, extras: 0, wicketsLost: 0, 
        dismissalHistory: [], wicketRunsHistory: [], wormData: [{ ball: 0, runs: 0, wkt: false }] 
    };
}
