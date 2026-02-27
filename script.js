document.addEventListener("DOMContentLoaded", () => {
  const MEMBER_PASSWORD = "BigJigglyBalls";
  const MEMBERS_NUMBER = "(646) 444-4277";
  const MENU_JSON_PATH = "menu.json";

  // === AUDIO (Members Unlock Theme) ===
  // IMPORTANT: must match your actual filename exactly
  const UNLOCK_AUDIO_SRC = "media/High.mp3";
  let bgm = null;
  let bgmWanted = false; // user wants music on (unlocked)
  let resumeTapArmed = false;

  function initBgm() {
    if (bgm) return;
    bgm = new Audio(UNLOCK_AUDIO_SRC);
    bgm.loop = true;
    bgm.preload = "auto";
    bgm.volume = 0.85;
  }

  async function playBgm() {
    if (!bgmWanted) return;
    initBgm();
    try {
      await bgm.play();
    } catch (e) {
      armResumeTap();
      showToast("Tap to resume audio");
    }
  }

  function pauseBgm() {
    if (bgm && !bgm.paused) bgm.pause();
  }

  function armResumeTap() {
    if (resumeTapArmed) return;
    resumeTapArmed = true;

    const onceResume = async () => {
      resumeTapArmed = false;
      await playBgm();
    };

    // Any user interaction can re-enable audio on iOS
    document.addEventListener("touchend", onceResume, { once: true, passive: true });
    document.addEventListener("click", onceResume, { once: true });
  }

  // Public / vibe
  const logoTrigger = document.getElementById("logoTrigger");
  const membersSection = document.getElementById("members");
  const toast = document.getElementById("toast");
  const pressureEl = document.getElementById("pressureLevel");
  const cultEl = document.getElementById("cultLine");
  const taglineEl = document.getElementById("taglineText");

  // Gate + members content
  const gate = document.getElementById("gate");
  const memberContent = document.getElementById("memberContent");
  const passInput = document.getElementById("memberPass");
  const unlockBtn = document.getElementById("unlockBtn");
  const gateMsg = document.getElementById("gateMsg");

  // Number + actions
  const numberEl = document.getElementById("burnerNumber");
  const copyBtn = document.getElementById("copyBtn");
  const copyMsg = document.getElementById("copyMsg");
  const smsLink = document.getElementById("smsLink");

  // Menu UI
  const menuGrid = document.getElementById("menuGrid");
  const menuStatus = document.getElementById("menuStatus");

  // Neon leaf layer
  const neonLeafContainer = document.getElementById("leafContainer");

  let isUnlocked = false;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 1400);
  }

  function setPressure(state) {
    if (!pressureEl) return;
    pressureEl.textContent = `PRESSURE LEVEL: ${state}`;
  }

  showToast("JS ONLINE");

  // After Dark mode (10PM–5AM)
  const hour = new Date().getHours();
  const afterDark = (hour >= 22 || hour < 5);
  if (afterDark) {
    document.body.classList.add("after-dark");
    if (taglineEl) taglineEl.textContent = "After Hours Protocol Active.";
  }

  // Cult phrases
  const cultPhrases = afterDark
    ? ["We see you.", "Keep your voice low.", "Not everyone gets in.", "You weren’t supposed to find this."]
    : ["Members move in silence.", "Stay discreet.", "Access is earned.", "Say less."];

  function rotateCult() {
    if (!cultEl) return;
    cultEl.textContent = cultPhrases[Math.floor(Math.random() * cultPhrases.length)];
  }
  rotateCult();
  setInterval(rotateCult, 9000);

  // Hold logo to reveal members
  let holdTimer = null;
  let holding = false;

  function revealMembers() {
    if (!membersSection) return;
    membersSection.classList.remove("hidden");
    showToast("Members unlocked.");
    setPressure("ELEVATED");
    setTimeout(() => membersSection.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    setTimeout(() => passInput?.focus(), 400);
  }

  function startHold(e) {
    e.preventDefault();
    if (holding) return;
    holding = true;
    holdTimer = setTimeout(revealMembers, 1200);
  }

  function endHold() {
    holding = false;
    clearTimeout(holdTimer);
  }

  if (logoTrigger) {
    logoTrigger.addEventListener("touchstart", startHold, { passive: false });
    logoTrigger.addEventListener("touchend", endHold);
    logoTrigger.addEventListener("touchcancel", endHold);
    logoTrigger.addEventListener("mousedown", startHold);
    logoTrigger.addEventListener("mouseup", endHold);
    logoTrigger.addEventListener("mouseleave", endHold);
  }

  // Locked state
  function setLockedUI() {
    isUnlocked = false;
    bgmWanted = false;
    pauseBgm();

    if (numberEl) numberEl.textContent = "••• ••• ••••";
    if (copyBtn) copyBtn.disabled = true;

    if (smsLink) {
      smsLink.classList.add("disabled");
      smsLink.setAttribute("aria-disabled", "true");
      smsLink.href = "#";
    }

    if (copyMsg) copyMsg.textContent = "";
    if (menuGrid) menuGrid.innerHTML = "";
    if (menuStatus) menuStatus.textContent = "";
  }

  function setUnlockedUI() {
    isUnlocked = true;
    bgmWanted = true;

    gate?.classList.add("hidden");
    memberContent?.classList.remove("hidden");

    if (numberEl) numberEl.textContent = MEMBERS_NUMBER;
    if (copyBtn) copyBtn.disabled = false;

    if (smsLink) {
      smsLink.classList.remove("disabled");
      smsLink.removeAttribute("aria-disabled");
      smsLink.href = `sms:${encodeURIComponent(MEMBERS_NUMBER)}`;
    }

    showToast("Access granted.");
    setPressure("CLEARED");

    // Start looping audio (must be in this user gesture flow)
    playBgm();

    // Load menu AFTER unlock
    loadMenu();
  }

  setLockedUI();

  function isVideo(path = "") {
    return /\.(mp4|webm|ogg|mov)$/i.test(path);
  }

  function escapeHtml(s = "") {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  // ---------- CATEGORY GROUPING HELPERS ----------
  function normalizeCategory(cat = "") {
    const c = String(cat || "").trim();
    return c || "Other";
  }

  function categoryTitle(cat) {
    return normalizeCategory(cat).toUpperCase();
  }

  function groupByCategory(items) {
    const map = new Map();
    for (const it of items) {
      const cat = normalizeCategory(it.category);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(it);
    }
    return map;
  }

  function renderCategoryHeader(cat) {
    const header = document.createElement("div");
    header.className = "menu-section";
    header.innerHTML = `
      <div class="menu-section-title">${escapeHtml(categoryTitle(cat))}</div>
      <div class="menu-section-line"></div>
    `;
    return header;
  }

  function wireVideoAudioBehavior(rootEl) {
    if (!rootEl) return;
    const vids = rootEl.querySelectorAll("video");

    vids.forEach((v) => {
      // Avoid double-binding
      if (v.dataset.bgmBound === "1") return;
      v.dataset.bgmBound = "1";

      v.addEventListener("play", () => {
        // Video takes over audio — pause music
        pauseBgm();
      });

      v.addEventListener("pause", () => {
        // Pause is a user gesture — try resume
        if (bgmWanted) playBgm();
      });

      v.addEventListener("ended", () => {
        // Ended might not count as gesture; try resume and fallback
        if (bgmWanted) {
          playBgm();
          armResumeTap();
        }
      });
    });
  }

  async function loadMenu() {
    if (!menuGrid || !menuStatus) return;

    menuStatus.textContent = "Loading menu…";
    menuGrid.innerHTML = "";

    try {
      const res = await fetch(MENU_JSON_PATH, { cache: "no-store" });
      if (!res.ok) throw new Error("menu.json not found");
      const data = await res.json();

      if (!Array.isArray(data.items)) throw new Error("menu.json format invalid");

      if (data.items.length === 0) {
        menuStatus.textContent = "Menu is empty. Add items to menu.json.";
        return;
      }

      menuStatus.textContent = "";

      const grouped = groupByCategory(data.items);

      for (const [cat, items] of grouped.entries()) {
        menuGrid.appendChild(renderCategoryHeader(cat));

        for (const item of items) {
          const name = escapeHtml(item.name || "");
          const price = escapeHtml(item.price || "");
          const desc = escapeHtml(item.desc || item.description || "");
          const media = (item.media || "").trim();

          const card = document.createElement("div");
          card.className = "menu-item";

          let mediaHtml = "";
          if (media) {
            if (isVideo(media)) {
              mediaHtml = `
                <div class="menu-media">
                  <video controls playsinline preload="metadata" src="${escapeHtml(media)}"></video>
                </div>`;
            } else {
              mediaHtml = `
                <div class="menu-media">
                  <img loading="lazy" src="${escapeHtml(media)}" alt="${name}">
                </div>`;
            }
          }

          card.innerHTML = `
            <div class="menu-top">
              <div>
                <div class="menu-name">${name}</div>
                <div class="menu-cat">${escapeHtml(cat)}</div>
              </div>
              <div class="menu-price">${price}</div>
            </div>
            ${desc ? `<div class="menu-desc">${desc}</div>` : ""}
            ${mediaHtml}
          `;

          menuGrid.appendChild(card);
        }
      }

      // After the DOM is filled, bind video events
      wireVideoAudioBehavior(menuGrid);

    } catch (e) {
      menuStatus.textContent = "Menu failed to load. Check menu.json format + commit.";
    }
  }

  // Unlock attempt
  function unlockAttempt() {
    const attempt = (passInput?.value || "").normalize("NFKC").trim();

    if (!attempt) {
      if (gateMsg) gateMsg.textContent = "Enter the password.";
      return;
    }

    if (attempt === MEMBER_PASSWORD) {
      if (gateMsg) gateMsg.textContent = "";
      setUnlockedUI();
      return;
    }

    if (gateMsg) gateMsg.textContent = "WRONG PASSWORD.";
    if (passInput) {
      passInput.value = "";
      passInput.focus();
    }
  }

  unlockBtn?.addEventListener("click", unlockAttempt);
  passInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") unlockAttempt();
  });

  // Copy guarded
  copyBtn?.addEventListener("click", async () => {
    if (!isUnlocked) return;
    try {
      await navigator.clipboard.writeText(MEMBERS_NUMBER);
      if (copyMsg) copyMsg.textContent = "Copied.";
      setTimeout(() => { if (copyMsg) copyMsg.textContent = ""; }, 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = MEMBERS_NUMBER;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      if (copyMsg) copyMsg.textContent = "Copied.";
      setTimeout(() => { if (copyMsg) copyMsg.textContent = ""; }, 1200);
    }
  });

  /* =========================================================
     NEON POT LEAF RAIN (matches style.css: .neon-leaf + neonFall)
  ========================================================= */
  if (neonLeafContainer) {
    const leafSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <path fill="rgba(60,255,132,0.92)"
          d="M63 10c3 20 4 33 2 48 9-16 24-29 44-36-11 25-23 40-40 54
             18-3 34-1 52 7-20 14-38 19-54 18 12 11 21 27 23 52
             -22-12-36-28-44-45-8 17-22 33-44 45
             2-25 11-41 23-52-16 1-34-4-54-18
             18-8 34-10 52-7-17-14-29-29-40-54
             20 7 35 20 44 36-2-15-1-28 2-48z"/>
        <path fill="rgba(0,0,0,0.18)"
          d="M64 20c2 14 2 28 0 42 10-12 22-20 36-25
             -9 15-18 27-31 36 13-2 26-1 39 5
             -15 9-28 13-40 12 10 9 17 21 18 39
             -16-9-26-20-32-33-6 13-16 24-32 33
             1-18 8-30 18-39-12 1-25-3-40-12
             13-6 26-7 39-5-13-9-22-21-31-36
             14 5 26 13 36 25-2-14-2-28 0-42z"/>
      </svg>
    `;

    function spawnLeaf() {
      const leaf = document.createElement("div");
      leaf.className = "neon-leaf";
      leaf.innerHTML = leafSVG;

      const size = 10 + Math.random() * 12; // slightly smaller, less “clipped”
      leaf.style.width = size + "px";
      leaf.style.height = size + "px";
      leaf.style.left = (Math.random() * 100) + "vw";

      // More visible “wind”
      leaf.style.setProperty("--drift", (Math.random() * 240 - 120).toFixed(0) + "px");
      leaf.style.setProperty("--rot0", (Math.random() * 360).toFixed(0) + "deg");
      leaf.style.setProperty("--rot1", (Math.random() * 900 - 450).toFixed(0) + "deg");

      leaf.style.animationDuration = (9 + Math.random() * 14) + "s";
      leaf.style.opacity = (0.10 + Math.random() * 0.18).toFixed(2);

      neonLeafContainer.appendChild(leaf);
      setTimeout(() => leaf.remove(), 26000);
    }

    for (let i = 0; i < 10; i++) setTimeout(spawnLeaf, i * 180);
    setInterval(spawnLeaf, 650);
  }

  // If user leaves tab and comes back, try to resume if unlocked
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && bgmWanted) {
      playBgm();
      armResumeTap();
    }
  });
});
