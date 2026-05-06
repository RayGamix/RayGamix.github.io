console.log("Scripting.js is WORKING!");

    const VIP_USERS = ["admin", "StoicalRaybod9", "Test", "RayGamix"];
    let currentUser = "Guest";
    let rgDB = { users: {}, games: [{ name: "RayGamix Hub", creator: "The RayGamix Team", url: "https://raygamix.github.io" }] };

    try {
        if (localStorage.getItem('rg_active_user')) currentUser = localStorage.getItem('rg_active_user');
        if (localStorage.getItem('rg_database')) rgDB = JSON.parse(localStorage.getItem('rg_database'));
    } catch (e) { console.warn("Storage is sandboxed."); }

    function saveDB() {
        try {
            localStorage.setItem('rg_active_user', currentUser);
            localStorage.setItem('rg_database', JSON.stringify(rgDB));
        } catch (e) {} 
    }

    // --- VERIFICATION TIMER SYSTEM (1 Minute Tracker) ---
    let sessionSeconds = 0;
    let dailyPlayLogged = false;

    setInterval(() => {
        if (currentUser !== "Guest" && !dailyPlayLogged) {
            sessionSeconds++;
            if (sessionSeconds >= 60) {
                logDailyPlay();
                dailyPlayLogged = true; // Stop counting for this session
            }
        }
    }, 1000);

    function logDailyPlay() {
        let profile = rgDB.users[currentUser];
        if (!profile.stats) profile.stats = { lastPlayDay: 0, streak: 0, verified: false };

        const isVIP = VIP_USERS.includes(currentUser);
        const today = Math.floor(Date.now() / 86400000); // Current Day Number
        const lastPlay = profile.stats.lastPlayDay;

        if (isVIP) {
            profile.stats.verified = true; // Force verify VIPs
        }

        if (lastPlay === today) return; // Already played today

        if (lastPlay === today - 1) {
            // Played yesterday, streak continues!
            profile.stats.streak += 1;
        } else if (lastPlay > 0) {
            // Missed days
            let daysMissed = today - lastPlay - 1;
            if (daysMissed >= 3 && !isVIP) {
                if (profile.stats.verified) alert("⚠️ You missed 3+ days and lost your Verified Badge! Keep playing to earn it back.");
                profile.stats.verified = false;
            }
            profile.stats.streak = 1; // Streak resets, but today counts as day 1
        } else {
            profile.stats.streak = 1; // First time playing
        }

        // Check for 7-day Verification for non-VIPs
        if (profile.stats.streak >= 7 && !profile.stats.verified) {
            profile.stats.verified = true;
            alert("🎉 CONGRATULATIONS! You played 7 days in a row! You are now VERIFIED!");
        }

        profile.stats.lastPlayDay = today;
        saveDB();
        updateUI();
    }

    // --- AUTHENTICATION ---
    function handleAuth(type) {
        const u = document.getElementById('accU').value.trim();
        const p = document.getElementById('accP').value;
        if (!u || !p) return alert("⚠️ Please enter both a username and password.");

        if (type === 'signup') {
            if (rgDB.users[u]) return alert("❌ Username is already taken!");
            rgDB.users[u] = { password: p, avatar: {}, colors: {}, stats: { lastPlayDay: 0, streak: 0, verified: false } };
            alert("✅ Account Created!");
        } else if (type === 'login') {
            if (!rgDB.users[u] || rgDB.users[u].password !== p) return alert("❌ Wrong Username or Password!");
        }

        currentUser = u;
        sessionSeconds = 0; 
        dailyPlayLogged = false;

        // Auto-Verify VIP users on login
        if (VIP_USERS.includes(currentUser)) {
            if (!rgDB.users[currentUser].stats) {
                rgDB.users[currentUser].stats = { lastPlayDay: 0, streak: 0, verified: true };
            } else {
                rgDB.users[currentUser].stats.verified = true;
            }
        }

        saveDB(); loadUserProfile(); updateUI(); toggleDD('userDD');
    }

    function guestLogin() { currentUser = "Guest"; saveDB(); renewAvatar(); updateUI(); toggleDD('userDD'); }
    function handleLogout() { currentUser = "Guest"; saveDB(); renewAvatar(); updateUI(); toggleDD('userDD'); }

    function updateUI() {
        document.getElementById('uDisp').innerText = currentUser;
        
        if (currentUser === "Guest") {
            document.getElementById('loginFormArea').style.display = 'block';
            document.getElementById('profileArea').style.display = 'none';
            document.getElementById('vBadge').style.display = 'none';
            document.getElementById('streakDisp').style.display = 'none';
        } else {
            document.getElementById('loginFormArea').style.display = 'none';
            document.getElementById('profileArea').style.display = 'block';
            
            let stats = rgDB.users[currentUser].stats;
            if (stats) {
                document.getElementById('vBadge').style.display = stats.verified ? 'inline-block' : 'none';
                // Show streak display, VIPs have streak shown too
                document.getElementById('streakDisp').style.display = 'block';
                document.getElementById('streakNum').innerText = stats.streak;
            }
        }
    }

    // --- AVATAR SYSTEM ---
    function loadUserProfile() {
        if (currentUser === "Guest" || !rgDB.users[currentUser]) return;
        const profile = rgDB.users[currentUser];
        
        if (profile.colors['--head-c']) setPartColor('--head-c', profile.colors['--head-c'], false);
        if (profile.colors['--torso-c']) setPartColor('--torso-c', profile.colors['--torso-c'], false);
        if (profile.colors['--larm-c']) setPartColor('--larm-c', profile.colors['--larm-c'], false);
        if (profile.colors['--rarm-c']) setPartColor('--rarm-c', profile.colors['--rarm-c'], false);
        if (profile.colors['--lleg-c']) setPartColor('--lleg-c', profile.colors['--lleg-c'], false);
        if (profile.colors['--rleg-c']) setPartColor('--rleg-c', profile.colors['--rleg-c'], false);

        if (profile.avatar.face) document.getElementById('char-face').style.backgroundImage = `url('${profile.avatar.face}')`;
        if (profile.avatar.decals) {
            for (const [side, url] of Object.entries(profile.avatar.decals)) {
                document.querySelector(`#char-torso .${side}`).style.backgroundImage = `url('${url}')`;
            }
        }
    }

    function setPartColor(v, val, save = true) { 
        document.documentElement.style.setProperty(v, val); 
        if (save && currentUser !== "Guest") {
            rgDB.users[currentUser].colors[v] = val; saveDB();
        }
    }
    function setGlobalSkin(v) { ['--head-c','--torso-c','--larm-c','--rarm-c','--lleg-c','--rleg-c'].forEach(p => setPartColor(p, v)); }

    function applyDecal() {
        const u = document.getElementById('shUrl').value;
        const s = document.getElementById('shSide').value;
        if(u) {
            document.querySelector(`#char-torso .${s}`).style.backgroundImage = `url('${u}')`;
            if (currentUser !== "Guest") {
                if (!rgDB.users[currentUser].avatar.decals) rgDB.users[currentUser].avatar.decals = {};
                rgDB.users[currentUser].avatar.decals[s] = u; saveDB();
            }
        }
    }

    function equipVerifiedShirt() {
        if (currentUser === "Guest" || !rgDB.users[currentUser].stats?.verified) {
            alert("❌ You must be a Verified User (play 7 days in a row) to wear this exclusive shirt!");
            return;
        }
        // Exclusive Verified Texture
        const vShirt = "https://raybod8765.github.io/VerifiedIcons/VerifiedIcon.png";
        document.querySelector('#char-torso .front').style.backgroundImage = `url('${vShirt}')`;
        
        if (!rgDB.users[currentUser].avatar.decals) rgDB.users[currentUser].avatar.decals = {};
        rgDB.users[currentUser].avatar.decals['front'] = vShirt;
        saveDB();
        alert("⭐ Verified Shirt Equipped!");
    }

    function applyFace() {
        const u = document.getElementById('fcInput').value;
        if(u) { 
            document.getElementById('char-face').style.backgroundImage = `url('${u}')`; 
            if (currentUser !== "Guest") { rgDB.users[currentUser].avatar.face = u; saveDB(); }
            closeOverlays(); 
        }
    }

    function renewAvatar() {
        setGlobalSkin('#ffdbac');
        document.getElementById('char-face').style.backgroundImage = "var(--face-url)";
        document.querySelectorAll('#char-torso .side').forEach(s => s.style.backgroundImage = 'none');
        if (currentUser !== "Guest" && rgDB.users[currentUser]) {
            rgDB.users[currentUser].colors = {}; rgDB.users[currentUser].avatar = {}; saveDB();
        }
    }

    // --- GAME SYSTEM & VERIFIED TAGS ---
    function publishGame() {
        const name = document.getElementById('makerName').value;
        const url = document.getElementById('makerUrl').value;
        if(!name || !url) return alert("⚠️ Fill out the game details!");
        rgDB.games.push({ name, url, creator: currentUser });
        saveDB(); closeOverlays(); renderGames();
    }

    function launchGame(gameUrl) {
        let isVerified = false;
        if (currentUser !== "Guest" && rgDB.users[currentUser].stats?.verified) {
            isVerified = true;
        }
        
        // Inject the verified tag into the game's URL
        const separator = gameUrl.includes("?") ? "&" : "?";
        const finalUrl = `${gameUrl}${separator}user=${encodeURIComponent(currentUser)}&verified=${isVerified}`;
        
        window.open(finalUrl, '_blank');
    }

    function renderGames() {
        const grid = document.getElementById('gameGrid');
        const search = document.getElementById('gSearch').value.toLowerCase();
        grid.innerHTML = "";

        rgDB.games.filter(g => g.name.toLowerCase().includes(search)).forEach(g => {
            // Determine if the creator of the game is verified
            let creatorBadge = "";
            if (rgDB.users[g.creator] && rgDB.users[g.creator].stats?.verified) {
                creatorBadge = "✅";
            }

            grid.innerHTML += `
            <div class="card">
                <div style="height:120px; background:#050a0f; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:30px;">🎮</div>
                <div style="font-weight:700; margin-top:10px;">${g.name}</div>
                <div style="font-size:12px; color:var(--muted);">By ${g.creator} ${creatorBadge}</div>
                <button class="btn" style="margin-top:10px;" onclick="launchGame('${g.url}')">Play</button>
            </div>`;
        });
    }

    function toggleDD(id) { document.getElementById(id).classList.toggle('show'); }
    function openOverlay(id) { document.getElementById(id).style.display = 'flex'; }
    function closeOverlays() { document.querySelectorAll('.overlay').forEach(o => o.style.display = 'none'); }

    // Boot Up Engine
    updateUI();
    loadUserProfile();
    renderGames();