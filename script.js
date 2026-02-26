document.addEventListener("DOMContentLoaded", () => {
  const MEMBER_PASSWORD = "BigJigglyBalls";
  const MEMBERS_NUMBER = "(646) 444-4277";
  const MENU_JSON_PATH = "menu.json";

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

  // Neon leaf layer (this is the REAL one now)
  const neonLeafContainer = document.getElementById("leafContainer");

  let isUnlocked = false;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 1200);
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

    // Hide gate / show content
    gate?.classList.add("hidden");
    memberContent?.classList.remove("hidden");

    // Reveal number + enable actions
    if (numberEl) numberEl.textContent = MEMBERS_NUMBER;
    if (copyBtn) copyBtn.disabled = false;

    if (smsLink) {
      smsLink.classList.remove("disabled");
      smsLink.removeAttribute("aria-disabled");
      smsLink.href = `sms:${encodeURIComponent(MEMBERS_NUMBER)}`;
    }

    showToast("Access granted.");
    setPressure("CLEARED");

    // Load menu AFTER unlock
    loadMenu();
  }

  setLockedUI();

  // Video detection (supports .MOV too)
  function isVideo(path = "") {
    return /\.(mp4|webm|ogg|mov)$/i.test(path);
  }

  function escapeHtml(s = "") {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
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

      for (const item of data.items) {
        const cat = escapeHtml(item.category || "");
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
              <div class="menu-cat">${cat}</div>
            </div>
            <div class="menu-price">${price}</div>
          </div>
          ${desc ? `<div class="menu-desc">${desc}</div>` : ""}
          ${mediaHtml}
        `;

        menuGrid.appendChild(card);
      }
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <path d="M32 4c2 8 3 16 2 24 4-6 10-11 18-14-5 10-10 18-18 24 6-1 13-1 22 2-9 6-17 9-24 8 5 5 9 12 10 22-9-5-15-11-18-18-3 7-9 13-18 18 1-10 5-17 10-22-7 1-15-2-24-8 9-3 16-3 22-2-8-6-13-14-18-24 8 3 14 8 18 14-1-8 0-16 2-24z"
              fill="rgba(60,255,132,0.95)"/>
      </svg>
    `;

    function spawnLeaf() {
      const leaf = document.createElement("div");
      leaf.className = "neon-leaf";
      leaf.innerHTML = leafSVG;

      const size = 12 + Math.random() * 14; // 12–26px
      leaf.style.width = size + "px";
      leaf.style.height = size + "px";
      leaf.style.left = (Math.random() * 100) + "vw";

      leaf.style.setProperty("--drift", (Math.random() * 160 - 80).toFixed(0) + "px");
      leaf.style.setProperty("--rot0", (Math.random() * 360).toFixed(0) + "deg");
      leaf.style.setProperty("--rot1", (Math.random() * 720 - 360).toFixed(0) + "deg");

      leaf.style.animationDuration = (10 + Math.random() * 16) + "s";
      leaf.style.opacity = (0.10 + Math.random() * 0.18).toFixed(2);

      neonLeafContainer.appendChild(leaf);
      setTimeout(() => leaf.remove(), 28000);
    }

    // Spawn a burst immediately so you SEE it
    for (let i = 0; i < 10; i++) setTimeout(spawnLeaf, i * 180);

    // Then keep raining
    setInterval(spawnLeaf, 650);
  }
});
