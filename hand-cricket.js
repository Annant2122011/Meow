/* =========================================================
   CRICPULSE FUN-GUN ARENA | ULTIMATE STATS & AI ENGINE
   ========================================================= */
// ==========================================
// 🏏 SOUND MANAGER (AAA Audio Engine)
// ==========================================
const SoundManager = {
    enabled: true,
    bgm: new Audio('assets/stadium_bgm.mp3'),
    tracks: {
        batCrack: 'assets/bat_crack.mp3',
        crowdRoar: 'assets/crowd_roar.ogg',
        howzat: 'assets/howzat.mp3',
        coinSpend: 'assets/coin_spend.wav'
    },
    
    init: function() {
        this.bgm.loop = true;
        this.bgm.volume = 0.25; // Subtle background hum
    },
    
    play: function(trackName) {
        if (!this.enabled || !this.tracks[trackName]) return;
        let sfx = new Audio(this.tracks[trackName]);
        sfx.volume = 0.8;
        sfx.play().catch(() => console.log("SFX blocked until user interacts"));
    },
    
    startBGM: function() {
        if (this.enabled) this.bgm.play().catch(() => {});
    }
};
SoundManager.init();

// ==========================================
// ⏳ AFK MANAGER (Anti-Idle System)
// ==========================================
const AFKManager = {
    warningTimer: null,
    forfeitTimer: null,
    limit: 45000, // 45 seconds
    
    reset: function() {
        clearTimeout(this.warningTimer);
        clearTimeout(this.forfeitTimer);
        
        // Only trigger if deeply in a match
        const isMidMatch = gameState.isPlayerBatting !== null && !gameState.gameOver && !gameState.isTransitioning;
        if (isMidMatch) {
            this.warningTimer = setTimeout(() => this.triggerWarning(), this.limit);
        }
    },
    
    triggerWarning: function() {
        showConfirmModal(
            "⚠️ PLAYER INACTIVE ⚠️", 
            "You have been AFK for 45 seconds. The match will auto-forfeit in 15 seconds!", 
            () => { 
                clearTimeout(this.forfeitTimer); 
                executeForfeit(true); 
            }
        );
        
        // Dynamically change the Cancel button to "I'M HERE"
        setTimeout(() => {
            const cancelBtn = document.querySelector('#custom-confirm-modal .btn:nth-child(2)');
            if (cancelBtn) {
                cancelBtn.style.background = "#00ff88";
                cancelBtn.style.color = "black";
                cancelBtn.innerText = "I'M STILL HERE";
                cancelBtn.onclick = () => { closeConfirmModal(); this.reset(); };
            }
        }, 50);

        this.forfeitTimer = setTimeout(() => {
            closeConfirmModal();
            executeForfeit(true);
            showToast("⏳ Match Auto-Forfeited due to 60s of inactivity.");
        }, 15000);
    }
};
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

// MULTI-VARIATION COMMENTARY MASTER DATABASE
const commentaryMaster = {
    // 🎙️ Standard EN (Basic)
    // 🎙️ Standard EN (Basic)
    'default': {
        wkt_stumped: [
            "Stumped! [BATTER] is caught out of the crease.",
            "Wicket. The keeper whips the bails off to dismiss [BATTER].",
            "Out! [BATTER] is stumped.",
            "Keeper removes the bails in a flash. [BATTER] departs.",
            "[BATTER] is out of their ground. Stumped."
        ],
        wkt_hit: [
            "Hit wicket. [BATTER] steps on their own stumps.",
            "Out. [BATTER] retreats too far and dislodges the bails.",
            "Wicket. [BATTER] defends into the stumps.",
            "Disaster for [BATTER] as they step on the stumps.",
            "Hit wicket. [BATTER] dislodges the bails with their own bat."
        ],
        wkt_bowled: [
            "Bowled! Both threw [NUM]. [BATTER] is out.",
            "Wicket! [BATTER] misses and the stumps are hit.",
            "Out! Clean bowled.",
            "Through the gate! [BATTER] is bowled.",
            "The stumps are shattered. [BATTER] has to go."
        ],
        wide: [
            "Wide ball. Bowler threw 0, Batter threw [NUM]. +[RUNS] to [TEAM].",
            "Umpire signals wide. +[RUNS] runs for [TEAM].",
            "Wide delivery. +[RUNS] added to the total.",
            "That's too far outside the line. Wide signaled. +[RUNS] for [TEAM].",
            "Straying down the leg side. Umpire calls wide, adding +[RUNS] to [TEAM]."
        ],
        defend: [
            "Defended safely. 0 runs.",
            "Solid block. No run.",
            "Batter defends. 0 runs.",
            "Pushed back to the bowler. 0 runs.",
            "Played with a straight bat. No run."
        ],
        run_1_3: [
            "+[RUNS] runs scored.",
            "They take +[RUNS] runs.",
            "Pushed for +[RUNS].",
            "They cross over for +[RUNS].",
            "Worked away nicely for +[RUNS] runs."
        ],
        run_4: [
            "+4 Runs! Boundary.",
            "Hit away for 4 runs.",
            "4 runs to the total.",
            "Driven elegantly for 4 runs.",
            "Finds the gap and it rolls to the boundary for 4."
        ],
        run_5: [
            "+5 Runs from overthrows.",
            "5 runs taken.",
            "Rare 5 runs scored.",
            "Poor fielding results in 5 runs.",
            "An overthrow costs the fielding side. 5 runs."
        ],
        run_6: [
            "+6 Runs! A six is hit.",
            "Six runs! Clears the boundary.",
            "Massive hit for 6.",
            "Struck beautifully over the ropes for a six.",
            "High and handsome. 6 runs to the total."
        ]
    },
    // 📺 Pro Broadcast
    'pro': {
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
    },
// 📜 Elite Poetic
    'poetic': {
        wkt_stumped: [
            "🚨 Out of the crease, a careless stride, the keeper's gloves have crushed their pride. [BATTER] is stumped!",
            "⚡ A wandering foot, a fatal slip, the bails are off with a lightning whip! Farewell, [BATTER].",
            "🧤 Too far from home, a tragic fate, the keeper strikes and seals the gate. [BATTER] departs.",
            "🕺 A dance down the pitch, a swing of the bat, the keeper reacts and leaves them flat!",
            "🤯 Outside the line, a foolish quest, the quick-handed keeper does the rest. [BATTER] is gone.",
            "🎯 A heavy foot, a wand'ring mind, the keeper leaves the bails behind! [BATTER] is out."
        ],
        wkt_hit: [
            "🏏💥 Stepping back to block the ball, [BATTER] makes the timber fall! Hit wicket.",
            "🪵 A clumsy heel, a shattered bail, [BATTER]'s defense is to no avail.",
            "😱 Retreating deep into the night, [BATTER] strikes their stumps in fright!",
            "🤦‍♂️ A fateful step against the wood, [BATTER] has ruined their livelihood!",
            "😬 Defending deep with clumsy feet, [BATTER] ensures their own defeat!",
            "🛑 A massive swing, a backward pace, the bails are scattered round the place!"
        ],
        wkt_bowled: [
            "💥 Through the gate the ball has sped, the wooden stumps are lying dead. [BATTER] is bowled!",
            "🔥 A fiery dart, a beaten bat, the timber falls and that is that! [BATTER] is out.",
            "🎯 You threw the same, a perfect [NUM], the stumps are struck like a beaten drum.",
            "⚡ A deadly ball, an angled seam, the shattered stumps destroy the dream. [BATTER] departs.",
            "🪵 The woodwork flies, the bails are tossed, [BATTER] looks back at all they've lost.",
            "🤯 A spinning ball, a missing blade, the stumps are hit, the price is paid!"
        ],
        wide: [
            "↔️ Way off the mark, a straying line, +[RUNS] to [TEAM], a gift divine.",
            "🙅‍♂️ The umpire's arms are open wide, +[RUNS] free runs for the batting side.",
            "💸 A reckless throw, completely lost, +[RUNS] to [TEAM] without a cost.",
            "🧭 Far from the pitch, a wayward aim, +[RUNS] to [TEAM] to boost the game.",
            "👀 The bowler slips, the ball goes wide, a stroke of fortune for [TEAM]'s side.",
            "🎁 Way outside, beyond the reach, +[RUNS] extra runs upon the beach."
        ],
        defend: [
            "🛡️ A gentle tap, a solid block, the batter stands firm as a rock. 0 runs.",
            "🧱 No run is taken, no risk is made, the bowler's threat is smoothly played.",
            "🧘‍♂️ With perfect poise and grounded feet, the ball and bat safely meet.",
            "🥱 A quiet block, a watchful eye, the batter lets the danger fly.",
            "🛑 The bat comes down, the ball is dead, zero runs, just like I said.",
            "📉 Defended well, without a fright, the batter keeps the wicket tight."
        ],
        run_1_3: [
            "🏃 A nimble strike, a rapid pace, they add +[RUNS] to win the race.",
            "🏃‍♂️ With eager feet they cross the track, +[RUNS] more runs into the sack.",
            "🤌 A quiet push, a stolen run, they grab +[RUNS] beneath the sun.",
            "💨 A subtle touch, a quick sprint through, +[RUNS] runs are added to the crew.",
            "⚡ Through the gap with careful grace, they steal +[RUNS] runs to keep the pace.",
            "🏏 A gentle tap, they dash away, +[RUNS] more runs to build the play."
        ],
        run_4: [
            "🔥 A cracking shot, a glorious sound, 4 runs go racing to the ground!",
            "🚀 The fielders chase but look in vain, 4 beautiful runs to ease the pain.",
            "⚡ It splits the gap with pure delight, 4 runs shine brightly in the night.",
            "🤌 A sweet caress, a regal drive, 4 runs to keep the dream alive!",
            "💥 It skims the grass, it beats the chase, 4 stunning runs to win the race.",
            "🏏 A mighty sweep, a perfect hit, 4 runs are added to the kit!"
        ],
        run_5: [
            "🤪 A frantic throw, a fielding mess, 5 lucky runs to ease the stress!",
            "🤯 The ball flies wide, the fielders weep, 5 chaotic runs for them to keep.",
            "🏃 Overthrows and sheer dismay, 5 bizarre runs are given away.",
            "🏃🏃🏃 Chaos reigns upon the green, 5 runs like nothing ever seen!",
            "🤦‍♂️ A wild mistake, a total blunder, 5 runs to make the bowler wonder.",
            "🎁 A gift of runs, a sloppy throw, 5 extra runs to steal the show!"
        ],
        run_6: [
            "🚀 High in the air, a mighty blow, 6 massive runs to steal the show!",
            "🛸 Over the ropes, a perfect flight, 6 glorious runs to end the fight.",
            "👍 A giant swing, a roaring crowd, 6 runs are hit, majestic and proud!",
            "🔥 It scales the sky, it leaves the park, 6 massive runs to leave a mark!",
            "💥 A thunderous crack, an orbit bound, 6 runs that land beyond the ground!",
            "⚡ A brutal hit, it sails away, 6 runs to dominate the day!"
        ]
    },
   // 🇮🇳 Premium Hindi (Shayari & Rhyming Edition)
    'hindi': {
        wkt_stumped: [
            "🚨 क्रीज से भटके कदम, और कीपर ने कर दिया सितम! [BATTER] हो गए स्टंप आउट, अब पवेलियन लौट!",
            "⚡ हवा में बल्ला और पैर क्रीज के बाहर, कीपर की फुर्ती ने कर दिया बंटाधार! [BATTER] का खेल खत्म।",
            "🧤 थोड़ी सी लापरवाही पड़ी भारी, कीपर ने गिल्लियां उड़ाकर खत्म की [BATTER] की पारी!",
            "🕺 आगे बढ़कर मारना चाहते थे शॉट, पर कीपर ने पलक झपकते ही कर दिया आउट का प्लॉट!",
            "🤯 ना गेंद दिखी ना समझ आई चाल, [BATTER] हुए स्टंप और मच गया बवाल!",
            "🎯 क्रीज से निकले तो कीपर ने दिया चकमा, [BATTER] की पारी का यही था आखिरी पन्ना!"
        ],
        wkt_hit: [
            "🏏💥 कदमों की भूल और अपना ही नुकसान, [BATTER] ने खुद ही ले ली अपने विकेट की जान!",
            "🪵 बहुत पीछे गए और स्टंप्स से जा टकराए, हिट विकेट होकर [BATTER] अपना सिर खुजलाएं!",
            "😱 खुद ही बने अपने विकेट के दुश्मन, [BATTER] के इस शॉट ने बढ़ा दी सबकी उलझन!",
            "🤦‍♂️ गेंद को रोकने के चक्कर में हुआ भारी क्लेश, हिट विकेट होकर [BATTER] चले अपने देश!",
            "😬 इतनी गहराई में जाकर खेला शॉट, अपने ही स्टंप्स तोड़कर [BATTER] हुए आउट!",
            "🛑 ना गेंद ने छुआ ना बॉलर ने किया वार, [BATTER] ने खुद ही मान ली अपनी हार!"
        ],
        wkt_bowled: [
            "💥 दोनों ने चुना [NUM] और उड़ गई गिल्ली, [BATTER] की किस्मत आज हो गई ढीली!",
            "🔥 गजब की गेंद और मिडल स्टंप गायब, [BATTER] अब हो गए हैं आउट जनाब!",
            "🎯 डंडा गुल और बत्ती बुझ गई, [BATTER] की पारी आज यहीं पर रुक गई!",
            "⚡ गेंद ने ऐसा काटा बवाल, क्लीन बोल्ड होकर [BATTER] का हुआ बुरा हाल!",
            "🪵 बैट और पैड के बीच से निकली हवा, [BATTER] के बोल्ड होने का ये मंजर है गवाह!",
            "🤯 सीधा विकेटों पर प्रहार और खेल खल्लास, [BATTER] की पारी का हो गया सत्यानाश!"
        ],
        wide: [
            "↔️ दिशा भटकी और लाइन हुई खराब, [TEAM] को मिले +[RUNS] रन मुफ्त में जनाब!",
            "🎁 अंपायर ने दोनों हाथ फैलाए, [TEAM] के खाते में +[RUNS] रन और आए!",
            "👀 लेग स्टंप के बाहर फेंकी ये गेंद, +[RUNS] रनों के साथ [TEAM] का हुआ नया ट्रेंड!",
            "🧭 बॉलर भूल गया अपनी असली राह, +[RUNS] रन पाकर [TEAM] कर रही है वाह-वाह!",
            "💸 मुफ्त के रनों की हो रही है बरसात, +[RUNS] रन जुड़ गए [TEAM] के साथ!",
            "🙅‍♂️ वाइड गेंद का हुआ ऐलान, +[RUNS] रन पाकर [TEAM] के चेहरे पर आई मुस्कान!"
        ],
        defend: [
            "🛡️ ना कोई रन ना कोई हड़बड़ी, बल्लेबाज ने चुपचाप ये गेंद ब्लॉक करी! 0 रन।",
            "🧱 एकदम दीवार की तरह डटे रहे, गेंद को सम्मान देकर वहीं पर रुके रहे!",
            "🧘‍♂️ ना कोई शॉट ना कोई कमाल, शांति से खेला गया ये डॉट बॉल!",
            "🥱 गेंद आई और बैट से टकराई, 0 रन पर ही ये कहानी रुक गई भाई!",
            "🛑 ना कोई चौका ना कोई सिंगल, बल्लेबाज ने डिफेंस से जीत लिया ये दंगल!",
            "📉 कोई रिस्क नहीं, एकदम सेफ प्ले, 0 रन बनाकर बल्लेबाज ने किया स्टे!"
        ],
        run_1_3: [
            "🏃 हल्के हाथों से खेला और तेजी से भागे, +[RUNS] रन लेकर सबसे निकले आगे!",
            "⚡ गैप में धकेला और कर दी रनिंग स्टार्ट, +[RUNS] रन बटोरकर दिखाया अपना आर्ट!",
            "🏃‍♂️ फील्डर के पहुंचने से पहले ही किया कमाल, +[RUNS] रन दौड़कर मचा दिया बवाल!",
            "🤌 नजाकत से मारा और बदल ली छोर, +[RUNS] रन जुड़ गए टीम के स्कोर की ओर!",
            "💨 हवा की तरह दौड़े दोनों बल्लेबाज, +[RUNS] रन चुराकर कर दिया नया आगाज!",
            "🏏 सिंगल-डबल से चल रही है पारी, +[RUNS] रन की हो गई शानदार तैयारी!"
        ],
        run_4: [
            "🔥 कड़क शॉट और गेंद गई सीमा पार, पूरे 4 रन मिलेंगे इस बार!",
            "🚀 फील्डर बने दर्शक और गेंद बनी रॉकेट, 4 रनों से भर गई टीम की पॉकेट!",
            "⚡ गैप ढूंढा और कर दिया सीधा वार, इस चौके के साथ मिले पूरे 4!",
            "🤌 टाइमिंग ऐसी कि सब रह गए दंग, 4 रनों के साथ चढ़ा पारी का रंग!",
            "💥 बल्ले से निकली जैसी कोई गोली, 4 रनों से भर गई टीम की झोली!",
            "🏏 बेहतरीन कवर ड्राइव और नजाकत का खेल, 4 रन बनाकर कर दिया सबको फेल!"
        ],
        run_5: [
            "🤪 अफरा-तफरी मची और थ्रो हुआ खराब, मुफ़्त के 5 रन मिल गए जनाब!",
            "🤯 फील्डिंग टीम की हो गई बड़ी भूल, ओवरथ्रो के 5 रन हो गए कबूल!",
            "🏃 खराब थ्रो ने कर दिया बड़ा बवाल, 5 रन मुफ़्त में पाकर बल्लेबाज खुशहाल!",
            "🏃🏃🏃 भाग-दौड़ मची और विकेट पर नहीं लगा थ्रो, 5 रनों के साथ आगे बढ़ा ये शो!",
            "🤦‍♂️ बॉलर हैरान और फील्डर परेशान, 5 रनों का हो गया भारी नुकसान!",
            "🎁 ऐसी गलती तो किस्मत वालों को ही मिलती है, 5 रनों की ये सौगात खूब खिलती है!"
        ],
        run_6: [
            "🚀 गेंद गई सीधा आसमान के पार, इस छक्के ने कर दिया मैदान में हाहाकार! 6 रन!",
            "🛸 गगनचुंबी शॉट और ताकत का तूफान, 6 रनों के साथ उड़ा दी विपक्षी की जान!",
            "👍 खड़े-खड़े जड़ा ये दमदार प्रहार, 6 रन मिलेंगे पूरे इस बार!",
            "🔥 क्या टाइमिंग, क्या पावर, क्या शॉट है ये, पूरे 6 रन दिलाएगा ये!",
            "💥 गेंद को भेजा तारामंडल की सैर पर, 6 रन मिलेंगे बल्लेबाज के इस कहर पर!",
            "⚡ बल्ले से निकला जैसे कोई ब्रह्मास्त्र, 6 रनों से कर दिया बॉलर को पस्त!"
        ]
    },
   // 🔥 Bhojpuri Bawal (Rhyming Edition)
    'bhojpuri': {
        wkt_stumped: [
            "🚨 क्रीज से बाहर गइलें त कीपर कइलें खेला, [BATTER] के स्टंपिंग के लाग गइल मेला!",
            "⚡ तनी सा भटकेलें, कीपर के मिलल मौका, [BATTER] बाबू के लाग गइल धोखा!",
            "🧤 डगरा से उतरलें त हो गइल बवाल, स्टंप आउट होके [BATTER] भइलें बेहाल!",
            "🕺 आगे बढ़ के मारे के रहल चाहत, कीपर गिल्ली उड़ा के छीन लेलें राहत! [BATTER] आउट!",
            "🤯 बल्ला घूमे से पहिले उड़ी गिल्ली, [BATTER] के स्टंपिंग प हँसत बा दिल्ली!",
            "🎯 तनी सा चूक भारी पड़ल इहाँ, [BATTER] के स्टंपिंग के गूंजत बा धुआँ!"
        ],
        wkt_hit: [
            "🏏💥 पीछे जाके अपना ही गोड़ प मारलें कुल्हाड़ी, हिट विकेट होके [BATTER] हार गइलें पारी!",
            "🪵 स्टंप प जाके अपना ही देहिया टकरा गइल, [BATTER] के हिट विकेट देख के जियरा घबरा गइल!",
            "😱 बचाव करे के चक्कर में अपना ही घरवा में आग लगावल, हिट विकेट के [BATTER] के ई कइसन रोग धरावल!",
            "🤦‍♂️ बहुत गहिराई में जाके भइलें आउट, [BATTER] के ई शॉट प सभे के बा डाउट!",
            "😬 अपना ही गिल्ली गिरा के भइलें पस्त, हिट विकेट होके [BATTER] चल गइलें मस्त!",
            "🛑 ना केहू रोकल ना केहू टोकस, [BATTER] अपना ही विकेट प कर देलें फोकस!"
        ],
        wkt_bowled: [
            "💥 दूनों मारलें [NUM], गिल्ली उड़ गइल गगन में, [BATTER] क्लीन बोल्ड होके रोवत बाड़े मन में!",
            "🔥 गजब के यॉर्कर अउर डंडा भइल गुल, बोल्ड होके [BATTER] के उजड़ गइल फूल!",
            "🎯 सीधा जाके विकेट प लागल ई बान, [BATTER] के बोल्ड होके निकल गइल जान!",
            "⚡ गेंद रहे कि बिजली, समझ ना पावलें, मिडल स्टंप उखड़ल अउर [BATTER] आउट कहावलें!",
            "🪵 गजब के डिलीवरी, एकदम भउकाल, बोल्ड होके [BATTER] के भइल बुरा हाल!",
            "🤯 बैट-पैड के बीच से निकल गइल चकमा, [BATTER] के बोल्ड वाला छप गइल परचा!"
        ],
        wide: [
            "↔️ दिशाहीन गेंदा प अंपायर उठवलें हाथ, वाइड के +[RUNS] रन जुड़ गइल [TEAM] के साथ!",
            "🎁 ई त एकदम मुफ़्त के मिलल बा खजाना, +[RUNS] रन पाके [TEAM] गावत बा गाना!",
            "👀 लेग स्टंप से बहुत बाहर गइल ई बउरहा गेंद, वाइड के +[RUNS] रन से [TEAM] सेट कइलस ट्रेंड!",
            "🧭 बॉलर भुला गइलें आपन रस्ता, +[RUNS] रन [TEAM] के मिल गइल सस्ता!",
            "💸 खैरात में मिलल बा ई रनिया, +[RUNS] रन से [TEAM] के सजल बा धनिया!",
            "🙅‍♂️ अंपायर के दुनो हाथ गइल आसमान में, +[RUNS] रन जुड़ गइल [TEAM] के अरमान में!"
        ],
        defend: [
            "🛡️ आराम से रोकलें, ना कइलें कवनो हड़बड़ी, 0 रन प रुक गइल ई गेंद के घड़ी!",
            "🧱 एकदम देवाल नियन ठाड़ बाड़े भइया, 0 रन प रोक देलें ई गेंद के नइया!",
            "🧘‍♂️ कवनो छेड़छाड़ ना, चुपचाप कइलें पास, 0 रन के संगे ई गेंद भइल खल्लास!",
            "🥱 सीधा फील्डर के हाथ में, ना कवनो बवाल, 0 रन प ही रुक गइल ई डॉट बॉल!",
            "🛑 एकदम शांति से बल्ला अड़ावलें, 0 रन प अपना के सुरक्षित बतावलें!",
            "📉 ना चौका ना छक्का, खाली आराम बा, 0 रन प ही ई गेंद के मुकाम बा!"
        ],
        run_1_3: [
            "🏃 धीरे से ढकेल के तेजी से भागलें, +[RUNS] रन लेत टाइम जियरा जगावलें!",
            "🏃‍♂️ फील्डर सोचे से पहिले बदल लेलें छोर, +[RUNS] रन से [TEAM] करत बा शोर!",
            "🤌 नजाकत से मार के चुरा लेलें रन, +[RUNS] रन से सभे के हरषा गइल मन!",
            "💨 आँधी नियन उड़ के क्रीज पार कइलें, +[RUNS] रन से [TEAM] के बेड़ा पार कइलें!",
            "⚡ चुप्पे-चापे गैप में निकाल देलें गेंदवा, +[RUNS] रन पाके नाचे लागल मनवा!",
            "🏏 सिंगल-डबल से पारी के बढ़ावत बाड़े, +[RUNS] रन से सभे के देखावत बाड़े!"
        ],
        run_4: [
            "🔥 कड़क शॉट मारलें, गेंद गइल बाउंड्री पार, 4 रन मिलल बा ई शानदार!",
            "🚀 फील्डर बनलें दर्शक, गेंद बनल रॉकेट, 4 रन जाके गिरल [TEAM] के पॉकेट!",
            "⚡ गैप चीर के निकलल गेंदा सन्न से, 4 रन जुड़ गइल एकदम फन्न से!",
            "🤌 मारलें अइसन तमाचा कि गेंद रोवत गइल, 4 रन के चौका ई झकास भइल!",
            "💥 कवर ड्राइव देख के मनवा गदगद भइल, 4 रन के संगे ई शॉट लाजवाब रहल!",
            "🏏 एक टप्पा खाके गेंद पार कइलस रेखा, 4 रन के ई गजब तमाशा सभे देखा!"
        ],
        run_5: [
            "🤪 लफड़ा भइल मैदान प, ओवरथ्रो के बा बवाल, 5 रन मुफ़्त में मिलल गजबे ई कमाल!",
            "🤯 ई का कइलें फील्डर, थ्रो फेंकले बेकार, 5 रन से [TEAM] के लग गइल बेड़ा पार!",
            "🏃 अफरा-तफरी मचल बा, केहू ना समझे खेल, 5 रन मुफ़्त में पाके बॉलर भइलें फेल!",
            "🏃🏃🏃 भागम-भाग में छूटल गेंदा, फील्डर भइलें सुस्त, 5 रन पाके गदगद बाड़े एकदम चुस्त!",
            "🤦‍♂️ बॉलर नोचत बाड़े कपार, ई का भइल भइया, 5 रन देके डुबा देलें नइया!",
            "🎁 मुफ़्त के 5 रन, ई त एकदम खैरात बा, विपक्षी टीम के भइल ई कइसन मात बा!"
        ],
        run_6: [
            "🚀 उड़ा देलें आसमान में गेंदा भइल गुम, 6 रन के ई छक्का मचावत बा धूम!",
            "🛸 तान के मारलें, गेंद गइल तारामंडल में, 6 रन के छक्का गूंजत बा भूमंडल में!",
            "👍 ठाड़े-ठाड़े मारलें ई गजब के प्रहार, 6 रन मिलल बा ई एकदम झकास यार!",
            "🔥 बॉलर के पसीना छूटल ई शॉट देख के, 6 रन ले लेलें गेंदा बाउंड्री पार फेंक के!",
            "💥 बैट प आवाज़ आइल एकदम कड़कड़ा के, 6 रन मिलल बा ई छक्का भड़कड़ा के!",
            "⚡ ना फील्डर हिलल ना केहू कुछ कर पावल, 6 रन के ई शॉट गजबे कहर ढावल!"
        ]
    }
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

// SHOP DATABASE (HYBRID COLLECTION SYSTEM)
const shopItems = {
    avatars: [
        { id: '👤', name: 'Default', price: 0, rarity: 'common' },
        { id: '🐯', name: 'Tiger', price: 499, rarity: 'common' },
        { id: '👽', name: 'Alien', price: 1499, rarity: 'uncommon' },
        { id: '🤖', name: 'Robot', price: 2999, rarity: 'uncommon' },
        { id: '🤫', name: 'Silencer', price: 5999, rarity: 'rare' },
        { id: '🥷', name: 'Ninja', price: 12999, rarity: 'epic' },
        { id: '🐉', name: 'Dragon', price: 24999, rarity: 'epic' },
        { id: '👑', name: 'King', price: 49999, rarity: 'legendary' },
        { id: '🦁', name: 'Alpha Lion', price: 99999, rarity: 'legendary' }
    ],
    themes: [
        { id: 'default', name: 'Cyber Green', price: 0, icon: '🟩', rarity: 'common' },
        { id: 'synthwave', name: 'Synthwave', price: 2999, icon: '🟪', rarity: 'uncommon' },
        { id: 'blood', name: 'Blood Red', price: 6999, icon: '🟥', rarity: 'rare' },
        { id: 'matrix', name: 'Matrix Code', price: 14999, icon: '💻', rarity: 'epic' },
        { id: 'ocean', name: 'Deep Ocean', price: 29999, icon: '🌊', rarity: 'epic' },
        { id: 'gold', name: 'Royal Gold', price: 79999, icon: '🟨', rarity: 'legendary' }
    ],
    coins: [
        { id: 'default', name: 'Lead Coin', price: 0, icon: '🪙', rarity: 'common' }, 
        { id: 'copper', name: 'Copper Coin', price: 2499, icon: '🟤', rarity: 'common' },
        { id: 'silver', name: 'Silver Coin', price: 4999, icon: '⚪', rarity: 'uncommon' }, 
        { id: 'gold', name: 'Gold Coin', price: 9999, icon: '🟡', rarity: 'rare' },
        { id: 'dollar', name: 'Dollar Coin', price: 19999, icon: '💲', rarity: 'rare' },
        { id: 'bitcoin', name: 'Crypto Coin', price: 39999, icon: '₿', rarity: 'epic' }, 
        { id: 'diamond', name: 'Diamond Coin', price: 59999, icon: '💎', rarity: 'epic' },
        { id: 'emerald', name: 'Emerald Coin', price: 89999, icon: '❇️', rarity: 'legendary' },
        { id: 'obsidian', name: 'Dark Obsidian', price: 150000, icon: '🌑', rarity: 'legendary' }
    ],
    backgrounds: [
        { id: 'bg-default', name: 'Plain Dark', price: 0, icon: '⬛', rarity: 'common' },
        { id: 'bg-gully', name: 'Gully Streets', price: 3500, icon: '🏘️', rarity: 'uncommon' },
        { id: 'bg-stadium', name: 'Night Stadium', price: 8500, icon: '🏟️', rarity: 'rare' },
        { id: 'bg-cyber', name: 'Neon Cyber City', price: 25000, icon: '🌃', rarity: 'epic' },
        { id: 'bg-colosseum', name: 'The Colosseum', price: 60000, icon: '🏛️', rarity: 'legendary' },
        { id: 'bg-galaxy', name: 'Galactic Arena', price: 120000, icon: '🌌', rarity: 'legendary' }
    ],
    commentary: [
        { id: 'default', name: 'Standard EN', price: 0, icon: '🎙️', rarity: 'common' },
        { id: 'pro', name: 'Pro Broadcast', price: 5999, icon: '📺', rarity: 'uncommon' },
        { id: 'poetic', name: 'Elite Poetic', price: 14999, icon: '📜', rarity: 'rare' },
        { id: 'hindi', name: 'Premium Hindi', price: 49999, icon: '🇮🇳', rarity: 'epic' },
        { id: 'bhojpuri', name: 'Bhojpuri Bawal', price: 99999, icon: '🔥', rarity: 'legendary' }
    ],
    sfxRoar: [
        { id: 'standard', name: 'Standard Crowd', price: 0, icon: '🗣️', rarity: 'common' },
        { id: 'massive', name: 'Stadium Eruption', price: 4999, icon: '🏟️', rarity: 'rare' },
        { id: 'alien', name: 'Alien Cheers', price: 19999, icon: '👽', rarity: 'epic' }
    ],
   exchange: [
        { id: 'ex_1k', name: 'Handful of Coins', coins: 1000, diaPrice: 0.3, icon: '💰' },
        { id: 'ex_5k', name: 'Coin Pouch', coins: 5000, diaPrice: 1.5, icon: '💰' },
        { id: 'ex_10k', name: 'Coin Sack', coins: 10000, diaPrice: 3.0, icon: '💰' },
        { id: 'ex_25k', name: 'Small Chest', coins: 25000, diaPrice: 7.2, icon: '🧰' },
        { id: 'ex_50k', name: 'Large Chest', coins: 50000, diaPrice: 14.0, icon: '🧰' },
        { id: 'ex_100k', name: 'Coin Vault', coins: 100000, diaPrice: 27.0, icon: '🏦' },
        { id: 'ex_250k', name: 'Bank Reserve', coins: 250000, diaPrice: 65.0, icon: '🏦' },
        { id: 'ex_500k', name: 'National Treasury', coins: 500000, diaPrice: 125.0, icon: '🏛️' },
        { id: 'ex_1m', name: 'The Motherlode', coins: 1000000, diaPrice: 240.0, icon: '👑' }
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
   u.unlockedBackgrounds = u.unlockedBackgrounds || ['bg-default'];
    u.unlockedCommentary = u.unlockedCommentary || ['default'];
    u.unlockedSfxBat = u.unlockedSfxBat || ['wood'];
    u.unlockedSfxRoar = u.unlockedSfxRoar || ['standard'];
    u.unlockedSfxWicket = u.unlockedSfxWicket || ['howzat'];

    u.equippedBackground = u.equippedBackground || 'bg-default';
    u.equippedCommentary = u.equippedCommentary || 'default';
    u.equippedSfxBat = u.equippedSfxBat || 'wood';
    u.equippedSfxRoar = u.equippedSfxRoar || 'standard';
    u.equippedSfxWicket = u.equippedSfxWicket || 'howzat';

    // --- ZERO MIGRATION: Wipe old data, start fresh ---
    delete u.last10SR;
    delete u.last20Innings;
    
    if (!u.last60SR) u.last60SR = [];
    if (!u.last35Innings) u.last35Innings = [];
    
    u.highestScoreNotOut = u.highestScoreNotOut || false; 
    u.customPFP = u.customPFP || null;
   // --- NEW ECONOMY & INVENTORY ---
    u.diamonds = u.diamonds || 0.00;
    u.cards = u.cards || { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    u.transactions = u.transactions || { coins: [], diamonds: [] };
    
    // Ensure all transactions have history arrays
    if (!u.transactions.coins) u.transactions.coins = [];
    if (!u.transactions.diamonds) u.transactions.diamonds = [];
    
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
    showConfirmModal(
        "SYSTEM DISCONNECT", 
        "Are you sure you want to log out? You will need your username to log back in.", 
        () => {
            // This runs if the user clicks "YES"
            localStorage.removeItem('hc_currentUser');
            window.location.href = 'index.html'; // Or 'auth.html' (Whatever your login page is named)
        }
    );
}
function bindPfpUpload() {
    let profBox = document.getElementById('prof-avatar-box');
    if (!profBox) return;
    
    profBox.style.cursor = 'pointer'; 
    
    profBox.onclick = () => {
        let usersDB = JSON.parse(localStorage.getItem('hc_usersDB'));
        let userStats = usersDB[currentUser];
        
        let isFirstTime = !userStats.hasBoughtPFP;
        let cost = isFirstTime ? 500000 : 5000;

        // 1. Create dynamic modal container with the new CROP view included
        let modal = document.getElementById('dynamic-pfp-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dynamic-pfp-modal';
            modal.className = 'modal-overlay';
            modal.style.display = 'none';
            modal.style.zIndex = '2000'; 
            
            modal.innerHTML = `
                <div class="modal-content" style="text-align: center; max-width: 450px; width: 90%;">
                    <h2 id="pfp-dyn-title" class="neon-text" style="margin-bottom: 15px;">MANAGE AVATAR</h2>
                    <p id="pfp-dyn-desc" style="color: var(--text-dim); margin-bottom: 25px; font-size: 1.1rem;"></p>
                    
                    <div id="pfp-dyn-choices" style="display: flex; flex-direction: column; gap: 15px;">
                        <button class="btn pulse-btn" id="btn-pfp-change">🖼️ CHANGE PICTURE</button>
                        <button class="btn pulse-btn" id="btn-pfp-remove" style="border-color: var(--accent-red); color: var(--accent-red);">🗑️ REMOVE PICTURE</button>
                        <button class="btn" style="background: rgba(255,255,255,0.1); color: white;" onclick="closePfpModal()">CANCEL</button>
                    </div>

                    <div id="pfp-dyn-confirm" style="display: none; flex-direction: column; gap: 15px;">
                        <button class="btn pulse-btn" id="btn-pfp-proceed" style="background: rgba(0,255,136,0.1);">✅ PROCEED</button>
                        <button class="btn" style="background: rgba(255,255,255,0.1); color: white;" id="btn-pfp-cancel">❌ CANCEL</button>
                    </div>

                    <div id="pfp-dyn-crop" style="display: none; flex-direction: column; gap: 15px; align-items: center;">
                        <div style="width: 100%; max-height: 300px; background: #111; border-radius: 8px; overflow: hidden;">
                            <img id="cropper-target-image" style="display: block; max-width: 100%;">
                        </div>
                        <div style="display: flex; gap: 10px; width: 100%;">
                            <button class="btn pulse-btn" id="btn-pfp-save-crop" style="flex: 1; background: rgba(0,255,136,0.1);">✂️ CROP & SAVE</button>
                            <button class="btn" id="btn-pfp-cancel-crop" style="flex: 1; background: rgba(255,255,255,0.1); color: white;">CANCEL</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // DOM Elements
        let title = document.getElementById('pfp-dyn-title');
        let desc = document.getElementById('pfp-dyn-desc');
        let choicesDiv = document.getElementById('pfp-dyn-choices');
        let confirmDiv = document.getElementById('pfp-dyn-confirm');
        let cropDiv = document.getElementById('pfp-dyn-crop');
        
        // Reset the modal to the first view
        choicesDiv.style.display = 'flex';
        confirmDiv.style.display = 'none';
        cropDiv.style.display = 'none';
        title.innerText = "MANAGE AVATAR";
        desc.innerText = "What would you like to do with your profile picture?";
        
        document.getElementById('btn-pfp-remove').style.display = userStats.customPFP ? 'block' : 'none';
        modal.style.display = 'flex';

        // Helper function to safely close and cleanup
        window.closePfpModal = () => {
            modal.style.display = 'none';
            if (currentCropper) {
                currentCropper.destroy();
                currentCropper = null;
            }
        };

        // ==========================================
        // ACTION: USER CLICKS "CHANGE PICTURE"
        // ==========================================
        document.getElementById('btn-pfp-change').onclick = () => {
            choicesDiv.style.display = 'none';
            confirmDiv.style.display = 'flex';
            title.innerText = isFirstTime ? "UNLOCK AVATAR" : "CHANGE AVATAR";
            desc.innerHTML = `Changing your Profile Picture will cost <b style="color: var(--accent-neon);">🪙 ${cost.toLocaleString()} coins</b>.<br><br>Do you want to proceed?`;
            
            document.getElementById('btn-pfp-proceed').onclick = () => {
                if (userStats.coins < cost) {
                    desc.innerHTML = `<span style="color: var(--accent-red);">❌ Not enough coins! You need 🪙 ${cost.toLocaleString()}</span>`;
                    document.getElementById('btn-pfp-proceed').style.display = 'none'; 
                    return;
                }
                
                // Open File Picker
                let input = document.createElement('input'); 
                input.type = 'file'; 
                input.accept = 'image/*';
                
                input.onchange = e => {
                    let file = e.target.files[0]; 
                    if (!file) return;

                    let reader = new FileReader();
                    reader.onload = event => {
                        // Switch to Crop View
                        confirmDiv.style.display = 'none';
                        cropDiv.style.display = 'flex';
                        title.innerText = "CROP AVATAR";
                        desc.innerText = "Drag and zoom to perfectly frame your avatar.";

                        let imgEl = document.getElementById('cropper-target-image');
                        imgEl.src = event.target.result;

                        // Initialize Cropper.js
                        if (currentCropper) currentCropper.destroy();
                        currentCropper = new Cropper(imgEl, {
                            aspectRatio: 1, // Forces a perfect square!
                            viewMode: 1,    // Restricts the crop box to not exceed the canvas
                            dragMode: 'move',
                           guides: false,  // <-- REMOVES THE DOTTED GRID
                        center: false,
                            background: false
                        });
                    };
                    reader.readAsDataURL(file);
                };
                input.click();
            };
        };

        // ==========================================
        // ACTION: SAVE CROPPED IMAGE
        // ==========================================
        document.getElementById('btn-pfp-save-crop').onclick = () => {
            if (!currentCropper) return;
            
            // Extract the perfectly cropped square
            let croppedCanvas = currentCropper.getCroppedCanvas({ width: 200, height: 200 });
            let finalImageUrl = croppedCanvas.toDataURL('image/png');

            // Save and Deduct Coins
            let db = JSON.parse(localStorage.getItem('hc_usersDB'));
            db[currentUser].coins -= cost;
            db[currentUser].hasBoughtPFP = true;
            db[currentUser].customPFP = finalImageUrl;
            localStorage.setItem('hc_usersDB', JSON.stringify(db));
            
            applyCosmetics(); 
           const cText = document.getElementById('prof-coins');
            if (cText) cText.innerText = formatCurrency(db[currentUser].coins);
            
            showToast(`🖼️ Custom PFP Cropped & Saved! (-🪙${cost.toLocaleString()})`);
            closePfpModal();
        };

        // ==========================================
        // OTHER ACTIONS (Remove & Cancels)
        // ==========================================
        document.getElementById('btn-pfp-remove').onclick = () => {
            choicesDiv.style.display = 'none';
            confirmDiv.style.display = 'flex';
            title.innerText = "REMOVE AVATAR";
            desc.innerHTML = `Removing your PFP to return to the default emoji is <b style="color: var(--accent-blue);">FREE</b>.<br><br>However, uploading a new picture later will cost 🪙 5,000 coins. Proceed?`;
            
            document.getElementById('btn-pfp-proceed').onclick = () => {
                let db = JSON.parse(localStorage.getItem('hc_usersDB'));
                db[currentUser].customPFP = null; 
                localStorage.setItem('hc_usersDB', JSON.stringify(db));
                applyCosmetics();
                closePfpModal();
                showToast("🗑️ Profile Picture Removed.");
            };
        };

        document.getElementById('btn-pfp-cancel').onclick = closePfpModal;
        document.getElementById('btn-pfp-cancel-crop').onclick = closePfpModal;
    };
}

      
    

// ==========================================
// 3. UI, SHOP & COSMETICS
// ==========================================


function applyCosmetics() {
    // 1. Check for user and initialize 'u' FIRST
    if (!currentUser) return;
    let u = JSON.parse(localStorage.getItem('hc_usersDB'))[currentUser];

    // 2. Apply Match Screen Background
    const matchScreen = document.getElementById('match-screen');
    if (matchScreen) {
        matchScreen.className = ''; // wipe old backgrounds
        matchScreen.classList.add(u.equippedBackground);
    }

    // 3. Apply New CSS Themes
    document.body.classList.remove('theme-synthwave', 'theme-blood', 'theme-matrix', 'theme-ocean', 'theme-gold');
    if (u.equippedTheme !== 'default') {
        document.body.classList.add('theme-' + u.equippedTheme);
    }

    // 4. Map the dynamic sounds based on equipped SFX
    SoundManager.tracks.batCrack = `assets/bat_${u.equippedSfxBat}.mp3`;
    SoundManager.tracks.crowdRoar = `assets/roar_${u.equippedSfxRoar}.mp3`;
    SoundManager.tracks.howzat = `assets/wkt_${u.equippedSfxWicket}.mp3`;
    
    // 5. Update UI Elements
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
            coinHeads.innerHTML = '₿(Heads)'; 
            coinTails.innerHTML = '₿(Tails)'; 
        } else {
            coinHeads.innerHTML = 'HEADS'; 
            coinTails.innerHTML = 'TAILS'; 
        }
    }
}
// ==========================================
// 🛍️ SHOP & HYBRID ECONOMY ENGINE
// ==========================================

// Centralized Rarity Requirements
const rarityData = {
    common:    { cardsReq: 5,  discount: 0.20 }, // 80% off if you have 5 Common Cards
    uncommon:  { cardsReq: 10, discount: 0.25 }, // 75% off if you have 10 Uncommon Cards
    rare:      { cardsReq: 5,  discount: 0.30 }, // 70% off if you have 5 Rare Cards
    epic:      { cardsReq: 3,  discount: 0.40 }, // 60% off if you have 3 Epic Cards
    legendary: { cardsReq: 1,  discount: 0.50 }  // 50% off if you have 1 Legendary Card
};

function renderShop() {
    let u = JSON.parse(localStorage.getItem('hc_usersDB'))[currentUser];
    
    const buildSection = (items, typeStr, unlockedArr, equippedId) => {
        let html = '';
        
        items.forEach(item => {
            let isUnlocked = unlockedArr.includes(item.id);
            let isEquipped = equippedId === item.id;
            
            // Format rarity for CSS classes and visual flair
            let rarityColor = item.rarity === 'legendary' ? '#fbbf24' : 
                              item.rarity === 'epic' ? '#a855f7' : 
                              item.rarity === 'rare' ? '#06b6d4' : 
                              item.rarity === 'uncommon' ? '#4ade80' : '#a1a1aa';
            
            // Wrap buttons in a flex column so they stack nicely
            let btnHtml = '<div style="display: flex; flex-direction: column; gap: 5px; width: 100%;">';
            
            if (isEquipped) {
                btnHtml += `<button class="shop-btn equipped" disabled>EQUIPPED</button>`;
            } else if (isUnlocked) {
                btnHtml += `<button class="shop-btn equip" onclick="equipItem('${typeStr}', '${item.id}')">EQUIP</button>`;
            } else {
                btnHtml += `<button class="shop-btn buy" style="border-bottom: 2px solid ${rarityColor};" onclick="openShopModal('${typeStr}', '${item.id}')">🪙 ${formatCurrency(item.price)}</button>`;
            }

            // ADD THE RESTORE/SELL BUTTON (If unlocked and it's not a free default item)
            if (isUnlocked && item.price > 0) {
                let refundAmt = Math.floor(item.price * 0.25); // 25% of original price
                btnHtml += `<button class="shop-btn" style="background: rgba(255,42,42,0.1); border: 1px solid var(--accent-red); color: var(--accent-red); padding: 6px; font-size: 0.8rem; letter-spacing: 1px;" onclick="refundItem('${typeStr}', '${item.id}', ${refundAmt})">♻️ SELL (🪙 ${formatCurrency(refundAmt)})</button>`;
            }
            
            btnHtml += '</div>';

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
    if (avatarsContainer) avatarsContainer.innerHTML = buildSection(shopItems.avatars, 'avatar', u.unlockedAvatars, u.equippedAvatar);
    
    const themesContainer = document.getElementById('shop-themes');
    if (themesContainer) themesContainer.innerHTML = buildSection(shopItems.themes, 'theme', u.unlockedThemes, u.equippedTheme);
    
    const coinsContainer = document.getElementById('shop-coins');
    if (coinsContainer) coinsContainer.innerHTML = buildSection(shopItems.coins, 'coin', u.unlockedCoins, u.equippedCoin);

    const commentaryContainer = document.getElementById('shop-commentary');
    if (commentaryContainer) commentaryContainer.innerHTML = buildSection(shopItems.commentary, 'commentary', u.unlockedCommentary, u.equippedCommentary);

    const backgroundsContainer = document.getElementById('shop-backgrounds');
    if (backgroundsContainer) backgroundsContainer.innerHTML = buildSection(shopItems.backgrounds, 'background', u.unlockedBackgrounds, u.equippedBackground);

    const sfxRoarContainer = document.getElementById('shop-sfxRoar');
    if (sfxRoarContainer) sfxRoarContainer.innerHTML = buildSection(shopItems.sfxRoar, 'sfxRoar', u.unlockedSfxRoar, u.equippedSfxRoar);
  
   // Render Diamond Exchange Tab
    const exchangeContainer = document.getElementById('shop-exchange');
    if (exchangeContainer) {
        let exHtml = '';
        shopItems.exchange.forEach(pkg => {
            exHtml += `
                <div class="shop-item">
                    <div class="shop-item-icon">${pkg.icon}</div>
                    <div class="shop-item-name">${pkg.name} <br><span style="color:#ffd700; font-size:0.8em;">🪙 ${formatCurrency(pkg.coins)}</span></div>
                    <button class="shop-btn buy" style="background: #00d2ff; color: black; border: none; margin-top: auto;" onclick="buyCoinsWithDiamonds('${pkg.id}')">💎 ${pkg.diaPrice.toFixed(1)}</button>
                </div>
            `;
        });
        exchangeContainer.innerHTML = exHtml;
    }
}

function openShopModal(type, itemId) {
    let u = JSON.parse(localStorage.getItem('hc_usersDB'))[currentUser];
    let itemMap = { 'avatar': shopItems.avatars, 'theme': shopItems.themes, 'coin': shopItems.coins, 'commentary': shopItems.commentary, 'background': shopItems.backgrounds, 'sfxRoar': shopItems.sfxRoar };
    let item = itemMap[type].find(i => i.id === itemId);
    if (!item) return;

    let rData = rarityData[item.rarity];
    let userCards = u.cards[item.rarity] || 0;
    let instantCoinPrice = item.price;
    let instantDiaPrice = getDiamondPrice(item.price);
    let grindPrice = Math.floor(item.price * rData.discount);
    let hasEnoughCards = userCards >= rData.cardsReq;

    document.getElementById('shop-item-title').innerHTML = `${item.icon || item.id} ${item.name} <span style="font-size: 0.6em; color: #a1a1aa;">(${item.rarity.toUpperCase()})</span>`;
    
    // Grind Option
    let reqsDiv = document.getElementById('shop-card-reqs');
    reqsDiv.innerHTML = `Cards Needed: <span style="color: ${hasEnoughCards ? '#00ff88' : '#ff2a2a'}">${userCards} / ${rData.cardsReq} ${item.rarity.toUpperCase()} Cards</span>`;
    
    let btnGrind = document.getElementById('btn-buy-grind');
    if (hasEnoughCards) {
        btnGrind.disabled = false; btnGrind.style.background = 'var(--accent-blue)'; btnGrind.style.color = 'black';
        btnGrind.innerHTML = `UNLOCK FOR 🪙 ${formatCurrency(grindPrice)}`;
        btnGrind.onclick = () => processPurchase(type, itemId, 'grind', grindPrice, 'coin', item.rarity, rData.cardsReq);
    } else {
        btnGrind.disabled = true; btnGrind.style.background = '#374151'; btnGrind.style.color = 'white';
        btnGrind.innerHTML = `LOCKED (NEED CARDS)`;
    }

    // Instant Options (Coins OR Diamonds)
    let btnCoin = document.getElementById('btn-buy-instant-coin');
    btnCoin.innerHTML = `🪙 ${formatCurrency(instantCoinPrice)}`;
    btnCoin.onclick = () => processPurchase(type, itemId, 'instant', instantCoinPrice, 'coin', null, 0);

    let btnDia = document.getElementById('btn-buy-instant-dia');
    btnDia.innerHTML = `💎 ${instantDiaPrice.toFixed(1)}`;
    btnDia.onclick = () => processPurchase(type, itemId, 'instant', instantDiaPrice, 'diamond', null, 0);

    document.getElementById('shop-purchase-modal').style.display = 'flex';
}

function processPurchase(type, itemId, method, finalPrice, currencyType, rarityType, cardsToDeduct) {
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
    let u = usersDB[currentUser];
    
    // Check balances
    if (currencyType === 'coin' && u.coins < finalPrice) return alert("Not enough coins!");
    if (currencyType === 'diamond' && u.diamonds < finalPrice) return alert("Not enough diamonds!");

    // Deduct Assets
    if (currencyType === 'coin') {
        u.coins -= finalPrice;
        logTransaction('coin', -finalPrice, `Shop Purchase (${method})`);
    } else {
        u.diamonds -= finalPrice;
        logTransaction('diamond', -finalPrice, `Shop Purchase (${method})`);
    }

    if (method === 'grind') u.cards[rarityType] -= cardsToDeduct;

    // Unlock Item
    if (type === 'avatar') u.unlockedAvatars.push(itemId);
    if (type === 'theme') u.unlockedThemes.push(itemId);
    if (type === 'coin') u.unlockedCoins.push(itemId);
    if (type === 'commentary') u.unlockedCommentary.push(itemId);
    if (type === 'background') u.unlockedBackgrounds.push(itemId);
    if (type === 'sfxRoar') u.unlockedSfxRoar.push(itemId);
    
    localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
    
    document.getElementById('shop-purchase-modal').style.display = 'none';
    showToast(`🛍️ Item Unlocked Successfully!`);
    SoundManager.play('coinSpend');
    
    document.getElementById('prof-coins').innerText = formatCurrency(u.coins);
    document.getElementById('prof-diamonds').innerText = u.diamonds.toFixed(2);
    
    renderShop();
}

function refundItem(type, itemId, refundAmt) {
    showConfirmModal(
        "RESTORE PURCHASE", 
        `Are you sure you want to sell this item? You will receive 🪙 ${formatCurrency(refundAmt)} (25% of base price).`, 
        () => {
            let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
            let u = usersDB[currentUser];
            
            // 1. Give Coins Back & Log it
            u.coins += refundAmt;
            logTransaction('coin', refundAmt, `Item Refund (${itemId})`);
            
            // 2. Remove from Unlocked Inventory Arrays
            if (type === 'avatar') u.unlockedAvatars = u.unlockedAvatars.filter(id => id !== itemId);
            if (type === 'theme') u.unlockedThemes = u.unlockedThemes.filter(id => id !== itemId);
            if (type === 'coin') u.unlockedCoins = u.unlockedCoins.filter(id => id !== itemId);
            if (type === 'commentary') u.unlockedCommentary = u.unlockedCommentary.filter(id => id !== itemId);
            if (type === 'background') u.unlockedBackgrounds = u.unlockedBackgrounds.filter(id => id !== itemId);
            if (type === 'sfxRoar') u.unlockedSfxRoar = u.unlockedSfxRoar.filter(id => id !== itemId);
            
            // 3. Auto-Unequip Fallback Logic (Switch to Default)
            if (type === 'avatar' && u.equippedAvatar === itemId) u.equippedAvatar = '👤';
            if (type === 'theme' && u.equippedTheme === itemId) u.equippedTheme = 'default';
            if (type === 'coin' && u.equippedCoin === itemId) u.equippedCoin = 'default';
            if (type === 'commentary' && u.equippedCommentary === itemId) u.equippedCommentary = 'default';
            if (type === 'background' && u.equippedBackground === itemId) u.equippedBackground = 'bg-default';
            if (type === 'sfxRoar' && u.equippedSfxRoar === itemId) u.equippedSfxRoar = 'standard';
            
            // 4. Save and Update UI
            localStorage.setItem('hc_usersDB', JSON.stringify(usersDB));
            
            showToast(`♻️ Item Sold! (+🪙${formatCurrency(refundAmt)})`);
            SoundManager.play('coinSpend'); // Plays a sound
            
            const cText = document.getElementById('prof-coins');
            if (cText) cText.innerText = formatCurrency(u.coins);
            
            applyCosmetics(); 
            renderShop();
        }
    );
}

function equipItem(type, itemId) {
    let usersDB = JSON.parse(localStorage.getItem('hc_usersDB')); 
    let u = usersDB[currentUser];
    
    if (type === 'avatar') u.equippedAvatar = itemId;
    if (type === 'theme') u.equippedTheme = itemId;
    if (type === 'coin') u.equippedCoin = itemId;
   if (type === 'commentary') u.equippedCommentary = itemId;
    if (type === 'background') u.equippedBackground = itemId;
    if (type === 'sfxRoar') u.equippedSfxRoar = itemId;
    
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
// Levels scale mathematically: Lvl 1=0, Lvl 2=50, Lvl 3=100, Lvl 4=150...
function applyRankUI(username, avatarBoxId) {
    const usersDB = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
    const xp = usersDB[username].xp || 0;
    
    let currentLevel = 1;
    let xpRequiredForNext = 50; 
    let totalXpNeededForNext = 50;
    let baseXPForCurrentLevel = 0;

    while (xp >= totalXpNeededForNext) {
        currentLevel++;
        baseXPForCurrentLevel = totalXpNeededForNext;
        xpRequiredForNext = currentLevel * 50; 
        totalXpNeededForNext += xpRequiredForNext;
    }

    let xpIntoCurrentLevel = xp - baseXPForCurrentLevel;
    let progressPercent = (xpIntoCurrentLevel / xpRequiredForNext) * 100;

    const rank = getRankDetails(xp);
    const avatarBox = document.getElementById(avatarBoxId);
    if (avatarBox) {
        avatarBox.className = '';
        avatarBox.classList.add(rank.class);
    }
    
    // Animate the stunning UI progress bar
    const lvlText = document.getElementById('prof-level-text');
    const progBar = document.getElementById('prof-level-bar');
    if (lvlText) lvlText.innerText = `LEVEL ${currentLevel}`;
    if (progBar) progBar.style.width = `${progressPercent}%`;

    return { rank, xp };
}





// Update your bindPfpUpload file reader logic to trigger initCropper:
// Inside bindPfpUpload -> reader.onload = event => { initCropper(event.target.result); };
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
        cText.innerText = formatCurrency(stats.coins);
    }
   const dText = document.getElementById('prof-diamonds');
    if (dText) dText.innerText = (stats.diamonds || 0).toFixed(2);
    
    document.getElementById('prof-username').innerText = currentUser;
    
    const rankData = applyRankUI(currentUser, 'prof-avatar-box');
    const rText = document.getElementById('prof-rank');
    
    if (rText) {
        rText.innerText = rankData.rank.title;
        rText.className = '';
        rText.classList.add(rankData.rank.class);
    }
    
 const xpText = document.getElementById('prof-xp');
if (xpText) xpText.innerText = formatCurrency(stats.xp || 0);

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
     SoundManager.startBGM();
    // 1. Update the Header Buttons
    toggleHeaderButtons('toss');

    // 2. Switch Screens
    if (setupScreen) setupScreen.style.display = 'none';
    
    // THE FIX: Hide the match screen so it doesn't overlap the toss!
    if (matchScreen) matchScreen.style.display = 'none'; 

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

   // Safely reset visibility without crashing
    const step1 = document.getElementById('toss-step-1');
    if (step1) step1.style.display = 'block';
    
    const resultScreen = document.getElementById('toss-result-screen');
    if (resultScreen) resultScreen.style.display = 'none';

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
function getDiamondPrice(coinPrice) {
    if (coinPrice === 0) return 0;
    // Scales dynamically: Base 2.5 for 10k, slightly cheaper per-coin at higher tiers
    let dPrice = 2.5 + ((coinPrice - 10000) * 0.00023);
    return Math.max(0.1, parseFloat(dPrice.toFixed(1)));
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
   const actionArea = document.getElementById('hand-action-area');
    if (actionArea) actionArea.style.display = 'flex';
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
function buyCoinsWithDiamonds(pkgId) {
    let pkg = shopItems.exchange.find(p => p.id === pkgId);
    if (!pkg) return;

    showConfirmModal(
        "DIAMOND EXCHANGE", 
        `Trade 💎 ${pkg.diaPrice.toFixed(1)} Diamonds for 🪙 ${pkg.coins.toLocaleString()} Coins?`, 
        () => {
            let db = JSON.parse(localStorage.getItem('hc_usersDB'));
            let u = db[currentUser];

            if (u.diamonds >= pkg.diaPrice) {
                u.diamonds -= pkg.diaPrice;
                u.coins += pkg.coins;
                
                logTransaction('diamond', -pkg.diaPrice, `Bought ${pkg.name}`);
                logTransaction('coin', pkg.coins, `Diamond Exchange`);
                
                localStorage.setItem('hc_usersDB', JSON.stringify(db));
                
                document.getElementById('prof-coins').innerText = formatCurrency(u.coins);
                document.getElementById('prof-diamonds').innerText = u.diamonds.toFixed(2);
                
                showToast(`💸 Exchange Successful! (+🪙${formatCurrency(pkg.coins)})`);
                SoundManager.play('coinSpend');
                renderShop();
            } else {
                showToast(`❌ Not enough Diamonds! Need ${pkg.diaPrice.toFixed(1)}`);
            }
        }
    );
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
   AFKManager.reset();
   
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
       currentBatterStats.dots++;
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
       SoundManager.play('howzat');
        comment = getRandomCommentary(getActiveCommentary().wkt_stumped).replace("[BATTER]", batterName);
    } else if (type === 'HIT_WICKET') {
       SoundManager.play('howzat');
        comment = getRandomCommentary(getActiveCommentary().wkt_hit).replace("[BATTER]", batterName);
    } else {
       SoundManager.play('howzat');
        comment = getRandomCommentary(getActiveCommentary().wkt_bowled).replace("[BATTER]", batterName).replace("[NUM]", num);
    }
    
    writeCommentary(comment, tType);
}
function handleWide(batterNum) {
    const currentBatterStats = gameState.isPlayerBatting ? gameState.playerStats : gameState.compStats;
    const runsToAdd = batterNum + 1; 
    
    currentBatterStats.runs += runsToAdd; 
    currentBatterStats.extras += runsToAdd; 
    currentBatterStats.currentWicketRuns += runsToAdd;
    


    const team = gameState.isPlayerBatting ? "You" : "Computer";
    
    let comment = getRandomCommentary(getActiveCommentary().wide)
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
       currentBatterStats.dots++;
    }
    
    currentBatterStats.wormData.push({ ball: currentBatterStats.balls, runs: currentBatterStats.runs, wkt: false });
    
    let comment = getRandomCommentary(getActiveCommentary().defend);
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
    const batterName = gameState.isPlayerBatting ? "YOU" : "THE COMPUTER";
    
    let currentScore = currentBatterStats.runs;
    let newScore = currentScore + runs;
    
    // INTEGRATED ELITE MILESTONE LOGIC
    let currentMilestone = Math.floor(currentScore / 50) * 50;
    let newMilestone = Math.floor(newScore / 50) * 50;
    
    if (newMilestone > currentMilestone && newMilestone >= 50) {
        SoundManager.play('crowdRoar');
        let mColor = newMilestone >= 100 ? "#e81cff" : "#00d2ff"; 
        let milestoneText = `🌟 UNBELIEVABLE! ${newMilestone} RUNS REACHED! ${batterName} IS DOMINATING! 🌟`;
        
        commentaryBox.innerHTML = `> <span style="color: ${mColor}; font-weight: 900; text-shadow: 0 0 15px ${mColor}; display: block; animation: pulse 1s infinite;">${milestoneText}</span>`;
        gameState.commentaryHistory.push(`↳ ${milestoneText}`);
    }

    // 2. APPLY CORE STATS
    currentBatterStats.runs += runs; 
    currentBatterStats.balls++; 
    currentBatterStats.currentWicketRuns += runs;
    currentBatterStats.wormData.push({ ball: currentBatterStats.balls, runs: currentBatterStats.runs, wkt: false });

    // 3. CONTEXTUAL COMMENTARY & SOUNDS
    let tType = null;
    let comment = "";
    let isBoundary = (runs === 4 || runs === 6);
    let isFirstBall = (currentBatterStats.balls === 1);
    let consecutiveDots = gameState.isPlayerBatting ? gameState.playerConsecZeros : gameState.compConsecZeros;

    if (isBoundary) SoundManager.play('batCrack');

    if (isFirstBall && runs === 6) {
        comment = `<span style="color: #ff2a2a; font-weight: bold;">🚀 SMACKED HARD out of the park on the very first ball! What an explosive start! (+6)</span>`;
        currentBatterStats.sixes++; tType = "six";
    } 
    else if (consecutiveDots >= 3 && isBoundary) {
        comment = `<span style="color: #00ff88; font-weight: bold;">⚡ Finally breaks the shackles! A boundary after a silent showdown of defense! (+${runs})</span>`;
        if (runs === 4) currentBatterStats.fours++;
        if (runs === 6) { currentBatterStats.sixes++; tType = "six"; }
    } 
    else {
        if (runs === 4) { 
            currentBatterStats.fours++; 
            comment = `<span style="color: #00ff88;">${getRandomCommentary(getActiveCommentary().run_4)}</span>`;
        } else if (runs === 6) { 
            currentBatterStats.sixes++; 
            comment = `<span style="color: #9333ea; font-weight: bold;">${getRandomCommentary(getActiveCommentary().run_6)}</span>`;
        } else if (runs === 5) {
            currentBatterStats.fives = (currentBatterStats.fives || 0) + 1; 
            comment = `<span style="color: #facc15;">${getRandomCommentary(getActiveCommentary().run_5)}</span>`;
        } else { 
            comment = `<span style="color: #3b82f6;">${getRandomCommentary(getActiveCommentary().run_1_3).replace(/\[RUNS\]/g, runs)}</span>`;
        }
    }
    
    writeCommentary(comment, tType);
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
       SoundManager.play('crowdRoar');
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
        if (result === "PLAYER_WINS") matchXP += 400;
        
        matchXP += gameState.playerStats.runs;
        matchXP += (gameState.compStats.wicketsLost * 10);
        
        let bossBonusXP = 0;
       if (gameState.isTournament && result === "PLAYER_WINS") {
            stats.bossesDefeated = (stats.bossesDefeated || 0) + 1;
            // Boss 9 is the Cricket God
            if (gameState.currentBoss === 9) stats.godDefeats = (stats.godDefeats || 0) + 1;
            
            if (gameState.currentBoss <= 2) bossBonusXP = 1000;
            else if (gameState.currentBoss <= 5) bossBonusXP = 2500;
            else if (gameState.currentBoss <= 8) bossBonusXP = 10000;
            else if (gameState.currentBoss <= 9) bossBonusXP = 100000;
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
   if (gameState.playerStats.runs >= 100) stats.careerCenturies = (stats.careerCenturies || 0) + 1;
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
   // --- 💎 DIAMOND & 🃏 CARD LOOT ENGINE ---
    if (result !== "FORFEIT") {
        // Calculate Diamonds
        let matchDiamonds = 0.05 - 0.01; // Base play reward minus tax
        if (result === "PLAYER_WINS") matchDiamonds += 0.10;
        
        logTransaction('diamond', matchDiamonds, `Match Reward (${result})`);
        
        // Calculate Card Drops
        let numCards = result === "PLAYER_WINS" ? 10 : (result === "TIE" ? 7 : 4);
        let dropResults = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
        
        for (let i = 0; i < numCards; i++) {
            let roll = Math.random();
            if (roll < 0.01) dropResults.legendary++;       // 1% chance
            else if (roll < 0.05) dropResults.epic++;       // 4% chance
            else if (roll < 0.20) dropResults.rare++;       // 15% chance
            else if (roll < 0.50) dropResults.uncommon++;   // 30% chance
            else dropResults.common++;                      // 50% chance
        }
        
        // Save Cards to DB
        stats.cards.common += dropResults.common;
        stats.cards.uncommon += dropResults.uncommon;
        stats.cards.rare += dropResults.rare;
        stats.cards.epic += dropResults.epic;
        stats.cards.legendary += dropResults.legendary;
        
        // Show detailed Loot Toast
        setTimeout(() => {
            showToast(`🃏 CARDS DROPPED: ${dropResults.common}C, ${dropResults.uncommon}U, ${dropResults.rare}R, ${dropResults.epic}E, ${dropResults.legendary}L`);
        }, 5500); // Trigger after the initial XP/Coin toast
    }
    
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
        
        if (level > ach.thresholds.length) {
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
    let dots = gameState.playerStats.dots;
    
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
   const screensToHide = ['toss-screen', 'match-screen', 'post-match-screen', 'toss-result-screen'];
screensToHide.forEach(id => {
    let el = document.getElementById(id);
    if (el) el.style.display = 'none';
});

// Also add this right below the screensToHide loop to reset the target box:
const targetBox = document.getElementById('target-box');
if (targetBox) targetBox.style.display = 'none';
    
    // 3. SHOW THE SETUP SCREEN
    toggleHeaderButtons('setup');

    const setupScreen = document.getElementById('setup-screen');
    if (setupScreen) setupScreen.style.display = 'block';
  
   // 4. WIPE THE GAME STATE CLEAN
gameState.isPlayerBatting = null;
gameState.matchActive = false; 
gameState.innings = 1;
gameState.target = null;             // <-- ADD THIS
gameState.gameOver = false;
gameState.isTransitioning = false;   // <-- ADD THIS
gameState.playerConsecZeros = 0;     // <-- ADD THIS
gameState.compConsecZeros = 0;       // <-- ADD THIS
gameState.commentaryHistory = [];
    
 gameState.playerStats = { 
        runs: 0, balls: 0, fours: 0, sixes: 0, fives: 0, extras: 0, wicketsLost: 0, 
        dots: 0, currentWicketRuns: 0, outOn: '-', hitCentury: false,
        dismissalHistory: [], wicketRunsHistory: [], wormData: [{ ball: 0, runs: 0, wkt: false }] 
    };
    gameState.compStats = { 
        runs: 0, balls: 0, fours: 0, sixes: 0, fives: 0, extras: 0, wicketsLost: 0, 
        dots: 0, currentWicketRuns: 0, outOn: '-', hitCentury: false,
        dismissalHistory: [], wicketRunsHistory: [], wormData: [{ ball: 0, runs: 0, wkt: false }] 
    };
}

// ==========================================
// 🏦 GRAND ECONOMY & LEDGER SYSTEM
// ==========================================

function formatCurrency(num) {
    if (num >= 1e11) return (num / 1e11).toFixed(2) + 'Kb'; // Kharab
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'Ab';  // Arab
    if (num >= 1e7) return (num / 1e7).toFixed(2) + 'C';   // Crore
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';   // Million
    if (num >= 1e5) return (num / 1e5).toFixed(2) + 'L';   // Lakh
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'; // Thousand
    return num.toString();
}

function logTransaction(type, amount, reason) {
    if (!currentUser) return;
    let db = JSON.parse(localStorage.getItem('hc_usersDB'));
    let u = db[currentUser];
    
    let date = new Date();
    let timestamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    let logEntry = { amount: amount, reason: reason, time: timestamp };
    
    if (type === 'coin') {
        u.coins += amount;
        u.transactions.coins.unshift(logEntry); // Add to top of history
    } else if (type === 'diamond') {
        u.diamonds += amount;
        u.diamonds = parseFloat(u.diamonds.toFixed(2)); // Prevent floating point bugs
        u.transactions.diamonds.unshift(logEntry);
    }
    
    localStorage.setItem('hc_usersDB', JSON.stringify(db));
}
// ==========================================
// THE LEDGER / TRANSACTION HISTORY ENGINE
// ==========================================

function openLedgerModal(currencyType) {
    if (!currentUser) return;
    
    // Grab fresh data directly from the save file
    const db = JSON.parse(localStorage.getItem('hc_usersDB'));
    const u = db[currentUser];
    
    const modal = document.getElementById('ledger-modal');
    const listContainer = document.getElementById('ledger-list');
    const titleEl = document.getElementById('ledger-title');
    
    // Clear old data
    listContainer.innerHTML = '';
    
    // Determine which array to map over and style the header
    let historyArray = [];
    if (currencyType === 'coin') {
        historyArray = u.transactions.coins || [];
        titleEl.innerHTML = '🪙 COIN LEDGER';
        titleEl.style.color = '#ffd700';
        titleEl.style.textShadow = '0 0 10px rgba(255,215,0,0.5)';
        modal.querySelector('.modal-content').style.borderColor = '#ffd700';
        modal.querySelector('.modal-content > div:first-child').style.borderBottomColor = '#ffd700';
    } else {
        historyArray = u.transactions.diamonds || [];
        titleEl.innerHTML = '💎 DIAMOND LEDGER';
        titleEl.style.color = '#00d2ff';
        titleEl.style.textShadow = '0 0 10px rgba(0,210,255,0.5)';
        modal.querySelector('.modal-content').style.borderColor = '#00d2ff';
        modal.querySelector('.modal-content > div:first-child').style.borderBottomColor = '#00d2ff';
    }

    // Populate the list
    if (historyArray.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color: var(--text-dim); margin-top: 20px; font-family: var(--font-display);">No transactions found.</p>';
    } else {
        historyArray.forEach(tx => {
            const row = document.createElement('div');
            row.className = 'ledger-row';
            
            // Logic for Income vs Expense
            const isIncome = tx.amount > 0;
            const amountColor = isIncome ? 'var(--accent-neon)' : 'var(--accent-red)';
            const amountPrefix = isIncome ? '+' : '';
            const currencySymbol = currencyType === 'coin' ? '🪙' : '💎';
            
            // Format the number (Coins use your K/M/L formatting, Diamonds stay as decimals)
            let displayAmount = Math.abs(tx.amount);
            if (currencyType === 'coin') {
                displayAmount = formatCurrency(displayAmount);
            } else {
                displayAmount = displayAmount.toFixed(2);
            }

            row.innerHTML = `
                <div class="tx-left">
                    <div class="tx-reason">${tx.reason}</div>
                    <div class="tx-date">${tx.time}</div>
                </div>
                <div class="tx-right">
                    <div class="tx-amount" style="color: ${amountColor}; text-shadow: 0 0 10px ${amountColor}80;">
                        ${amountPrefix}${displayAmount} ${currencySymbol}
                    </div>
                </div>
            `;
            listContainer.appendChild(row);
        });
    }

    // Show the modal
    modal.style.display = 'flex';
}

function closeLedgerModal() {
    document.getElementById('ledger-modal').style.display = 'none';
}
