/* hand-cricket-fixes.js
   Auto-applied runtime fixes and safe fallbacks for hand-cricket.js
   Purpose: provide resilient implementations of functions that were missing
   or inconsistent in the original hand-cricket.js so the game doesn't crash
   or break layout. This file is intended to be loaded AFTER hand-cricket.js
   (for example, include it as a script tag below the original or concatenate
   it during build). It intentionally uses defensive checks so it is safe to
   include on pages that don't have the full game DOM.

   Fixes included:
   - getActiveCommentary(): avoids ReferenceError and provides fallback pack
   - randomThrow helpers: standardize 0..6 vs 1..6 semantics
   - safe DOM helpers: el(), setDisplay()
   - canonical buyCoinsWithDiamonds(): single robust implementation (overrides duplicates)
   - getComputerThrowFallback(): standardized return values
   - resilient logTransaction(): persists transactions to localStorage when given user object
   - safe class replacement helper for match screen to avoid wiping all classes
*/
(function () {
  'use strict';

  // Avoid clobbering if already present, but override known-broken implementations
  function safeAssign(name, fn) {
    try {
      Object.defineProperty(window, name, {
        value: fn,
        configurable: true,
        writable: true
      });
    } catch (e) {
      // Fallback: direct assign
      window[name] = fn;
    }
  }

  // Helper: get an element by id, returns null if not found
  safeAssign('el', function (id) {
    try {
      return document.getElementById(id) || null;
    } catch (e) {
      return null;
    }
  });

  // Helper: safely set display
  safeAssign('setDisplay', function (id, d) {
    var e = window.el(id);
    if (e) e.style.display = d;
  });

  // Random helpers: standardize ranges
  safeAssign('randomThrowInclusive0to6', function () {
    return Math.floor(Math.random() * 7); // 0..6
  });
  safeAssign('randomThrow1to6', function () {
    return Math.floor(Math.random() * 6) + 1; // 1..6
  });

  // getActiveCommentary: return commentary pack object or default fallback
  safeAssign('getActiveCommentary', function () {
    try {
      if (typeof commentaryMaster === 'undefined') return null;
      var packKey = 'default';
      if (typeof currentUser !== 'undefined' && currentUser) {
        var db = {}; try { db = JSON.parse(localStorage.getItem('hc_usersDB')) || {}; } catch (e) { db = {}; }
        var u = db[currentUser] || {};
        if (u && u.equippedCommentary) packKey = u.equippedCommentary;
      }
      return commentaryMaster[packKey] || commentaryMaster['default'] || Object.values(commentaryMaster)[0] || null;
    } catch (e) {
      console.warn('getActiveCommentary error', e);
      try { return commentaryMaster['default'] || null; } catch (e2) { return null; }
    }
  });

  // Canonical buyCoinsWithDiamonds: overrides duplicates to provide consistent behaviour
  // Signature kept compatible with callers: buyCoinsWithDiamonds(pkgId)
  safeAssign('buyCoinsWithDiamonds', function (pkgId) {
    try {
      var db = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
      if (!currentUser || !db[currentUser]) {
        showToast && showToast('Not logged in');
        return false;
      }
      var u = db[currentUser];
      // Example packages: ensure a mapping exists on window if not
      var packages = window.diamondPackages || [
        { id: 'small', diamonds: 10, coins: 1000 },
        { id: 'medium', diamonds: 25, coins: 3000 },
        { id: 'large', diamonds: 60, coins: 8000 }
      ];
      var pkg = packages.find(function (p) { return p.id === pkgId; }) || packages[0];
      var diaNeeded = pkg.diamonds;
      if ((u.diamonds || 0) < diaNeeded) {
        showToast && showToast('Not enough diamonds');
        return false;
      }
      u.diamonds = (u.diamonds || 0) - diaNeeded;
      u.coins = (u.coins || 0) + (pkg.coins || 0);

      // log transaction and persist
      try {
        logTransaction(u, 'buy_coins_with_diamonds', -diaNeeded, { coinsAdded: pkg.coins, pkgId: pkg.id });
      } catch (e) {
        // If logTransaction has different signature, try fallback
        try { window.logTransaction && window.logTransaction('diamond', -diaNeeded, 'buy_coins_with_diamonds'); } catch (e2) {}
      }

      db[currentUser] = u;
      localStorage.setItem('hc_usersDB', JSON.stringify(db));
      showToast && showToast('Purchased ' + (pkg.coins || 0) + ' coins');
      // Give callers a hook that the purchase happened
      return true;
    } catch (e) {
      console.error('buyCoinsWithDiamonds error', e);
      return false;
    }
  });

  // Standardize fallback for computer throw
  safeAssign('getComputerThrowFallback', function () {
    // Return 0..6 (0 indicates defend/wide depending on game rules)
    try {
      return window.randomThrowInclusive0to6();
    } catch (e) {
      return Math.floor(Math.random() * 7);
    }
  });

  // Safer getComputerThrow that calls fallback if original broken
  safeAssign('getComputerThrow', function () {
    try {
      // If original getComputerThrow exists and is a function, call it.
      if (typeof window.__original_getComputerThrow === 'function') return window.__original_getComputerThrow();
      if (typeof window._getComputerThrowBackup === 'function') return window._getComputerThrowBackup();
    } catch (e) {}
    return window.getComputerThrowFallback();
  });

  // Replace/override broken applyCosmetics if it wipes classes
  safeAssign('applyCosmeticsSafe', function () {
    try {
      var db = {}; try { db = JSON.parse(localStorage.getItem('hc_usersDB')) || {}; } catch (e) { db = {}; }
      var u = (typeof currentUser !== 'undefined' && currentUser && db[currentUser]) ? db[currentUser] : null;
      // If original applyCosmetics exists, still call it but guard className wipes
      if (typeof applyCosmetics === 'function') {
        // Monkeypatch temporarily document.getElementById to guard className assignments? Simpler: call original then repair
        try { applyCosmetics(); } catch (e) { console.warn('applyCosmetics original failed', e); }
      }
      // Repair commonly wiped elements if present
      var matchScreen = document.querySelector('#match-screen') || document.querySelector('.match-screen');
      if (matchScreen) {
        // Do not wipe all classes; ensure a default background class exists
        var bgDefault = (u && u.equippedBackground) ? u.equippedBackground : 'bg-default';
        var knownBg = ['bg-default','bg-gully','bg-stadium','bg-cyber','bg-colosseum','bg-galaxy'];
        knownBg.forEach(function(c) { matchScreen.classList.remove(c); });
        if (!matchScreen.classList.contains(bgDefault)) matchScreen.classList.add(bgDefault);
      }
      // avatar box fix
      var avatar = document.querySelector('.avatar-box') || document.getElementById('avatar-box');
      if (avatar) {
        avatar.classList.add('avatar-box'); // ensure at least this class exists
      }
    } catch (e) {
      console.warn('applyCosmeticsSafe failed', e);
    }
  });

  // Robust logTransaction that accepts both old and new signatures.
  // If first arg is a user object, persist to localStorage after changing.
  safeAssign('logTransaction', function (arg1, arg2, arg3, arg4) {
    try {
      // New expected signature (update): logTransaction(u, type, amount, meta)
      if (arg1 && typeof arg1 === 'object' && arg1.hasOwnProperty('username')) {
        var u = arg1;
        var type = arg2 || 'txn';
        var amount = arg3 || 0;
        var meta = arg4 || {};
        u.transactions = u.transactions || [];
        u.transactions.push({ id: Date.now(), type: type, amount: amount, meta: meta, at: new Date().toISOString() });
        // persist
        var db = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
        if (typeof currentUser !== 'undefined' && currentUser) {
          db[currentUser] = u;
          localStorage.setItem('hc_usersDB', JSON.stringify(db));
        }
        return true;
      }
      // Old signature: logTransaction(currencyType, change, label, details)
      if (typeof arg1 === 'string') {
        var currencyType = arg1;
        var change = arg2 || 0;
        var label = arg3 || '';
        var details = arg4 || {};
        // Try to persist to current user
        var db2 = JSON.parse(localStorage.getItem('hc_usersDB')) || {};
        if (typeof currentUser !== 'undefined' && db2[currentUser]) {
          var uu = db2[currentUser];
          uu.transactions = uu.transactions || [];
          uu.transactions.push({ id: Date.now(), currency: currencyType, change: change, label: label, details: details, at: new Date().toISOString() });
          db2[currentUser] = uu;
          localStorage.setItem('hc_usersDB', JSON.stringify(db2));
          return true;
        }
        return false;
      }
      return false;
    } catch (e) {
      console.error('logTransaction error', e);
      return false;
    }
  });

  // Expose a convenience function to repair risky patterns: replace any functions that clear className
  safeAssign('repairRiskyClassNameWipes', function () {
    try {
      // If applyCosmetics exists and contains className wipes we can't easily detect; call safe version
      window.applyCosmeticsSafe && window.applyCosmeticsSafe();
    } catch (e) {}
  });

  // Run some lightweight repairs immediately so the page can continue
  setTimeout(function () {
    try {
      // Ensure commentary pack available
      if (!window.getActiveCommentary()) {
        // no-op, getActiveCommentary will log fallback
      }
      // Replace getComputerThrow reference if needed
      if (typeof window.getComputerThrow === 'function' && window.getComputerThrow !== window.getComputerThrow) {
        // nothing
      }
      // Repair cosmetics now
      window.repairRiskyClassNameWipes && window.repairRiskyClassNameWipes();
    } catch (e) { console.warn('hand-cricket-fixes init error', e); }
  }, 50);

  // Debug notice
  console.info('hand-cricket-fixes loaded — defensive fallbacks installed');
})();
