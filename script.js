// script.js — 統整版 + 平滑滾動
// 功能：
// 1) Stats：滑到才啟動，3秒由 0 → 目標天數（依 data-start）
// 2) Work：卡片各自滑入才播放 keyframes（.fade-up / .is-visible）
// 3) Work：資料夾分頁（公司 / 學習 / 全部）切換並重啟進場動畫
// 4) 所有 # 錨點（如 Contact）皆會平滑滾動
// 依賴：CSS 需有 .fade-up / .fade-up.is-visible 與 @keyframes fadeUp

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ 工具函式 ------------------ */

  const parseDate = (str) => {
    if (!str) return null;
    const s = String(str).trim().replace(/\//g, "-");
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
    const y = +m[1], mon = +m[2], d = +m[3];
    return new Date(y, mon - 1, d); // 本地 00:00
  };

  const daysFrom = (dateObj) => {
    if (!(dateObj instanceof Date) || isNaN(+dateObj)) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = today - dateObj;
    return Math.max(0, Math.floor(diffMs / 86400000));
  };

  const animateNumber = (el, target, duration = 3000) => {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      el.textContent = Math.round(target * p).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const hasIO = "IntersectionObserver" in window;

  /* ------------------ ① Stats：滑到才啟動 ------------------ */
  const statsSection = document.querySelector(".stats");
  if (statsSection) {
    const kpis = statsSection.querySelectorAll(".kpi.fade-up");
    const nums = statsSection.querySelectorAll(".num");
    nums.forEach((el) => (el.textContent = "0"));
    kpis.forEach((el, i) => {
      el.style.setProperty("--delay", `${i * 120}ms`);
      el.style.setProperty("--dur", "3000ms");
    });

    const startStats = () => {
      kpis.forEach((el) => el.classList.add("is-visible"));
      nums.forEach((n) => {
        const start = parseDate(n.dataset.start);
        const target = daysFrom(start);
        animateNumber(n, target, 3000);
      });
    };

    if (hasIO) {
      const statsIO = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          startStats();
          statsIO.disconnect();
        },
        { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
      );
      statsIO.observe(statsSection);
    } else startStats();
  }

  /* ------------------ ② Work：卡片進場動畫 ------------------ */
  const workCardsAll = document.querySelectorAll("#work .fade-up");
  const bindCardReveal = (cards) => {
    if (!cards?.length) return;
    if (!hasIO) {
      cards.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const cardIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (!ent.isIntersecting) return;
          ent.target.classList.add("is-visible");
          cardIO.unobserve(ent.target);
        });
      },
      { threshold: 0.2 }
    );
    cards.forEach((el) => {
      if (!el.hasAttribute("hidden")) cardIO.observe(el);
    });
  };

  workCardsAll.forEach((el, i) => {
    if (!el.style.getPropertyValue("--delay"))
      el.style.setProperty("--delay", `${i * 120}ms`);
    if (!el.style.getPropertyValue("--dur"))
      el.style.setProperty("--dur", "900ms");
  });
  bindCardReveal(workCardsAll);

 
  /* ------------------ ④ 平滑滾動（Contact 連頁尾） ------------------ */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId.length <= 1) return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        window.scrollTo({
          top: target.offsetTop,
          behavior: "smooth",
        });
      }
    });
  });
});

const globalFades = document.querySelectorAll('.fade-up');
if (globalFades.length) {
  if ("IntersectionObserver" in window) {
    const globalIO = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (!ent.isIntersecting) return;
        ent.target.classList.add('is-visible');
        globalIO.unobserve(ent.target);
      });
    }, { threshold: 0.2 });

    globalFades.forEach(el => globalIO.observe(el));
  } else {
    // 沒 IO 時直接顯示
    globalFades.forEach(el => el.classList.add('is-visible'));
  }
}

// ===== Work 卡片 Lightbox =====
document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;

  const imgEl   = lightbox.querySelector(".lightbox__img");
  const titleEl = lightbox.querySelector(".lightbox__title");
  const descEl  = lightbox.querySelector(".lightbox__desc");
  const overlay = lightbox;
  const closeBtns = lightbox.querySelectorAll("[data-lightbox-close]");

  function openLightbox(card) {
    const full = card.dataset.full;
    if (!full) return;

    imgEl.src = full;
    imgEl.alt = card.dataset.title || card.getAttribute("aria-label") || "";
    titleEl.textContent = card.dataset.title || "";
    descEl.textContent  = card.dataset.desc || "";

    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    imgEl.src = this.dataset.full;;
  }

  document.querySelectorAll(".work-card").forEach(card => {
    card.addEventListener("click", (e) => {
      e.preventDefault();          // 阻止原本 href 動作
      openLightbox(card);
    });
  });

  closeBtns.forEach(btn => btn.addEventListener("click", closeLightbox));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
});

// ===== Work 頁：資料夾篩選 =====
document.addEventListener("DOMContentLoaded", () => {
  const folderBar = document.querySelector(".folders");
  const grid = document.querySelector("#workGrid");
  if (!folderBar || !grid) return;   // 不在 work 頁就不執行

  const tabs  = folderBar.querySelectorAll(".folder-tab");
  const cards = grid.querySelectorAll(".work-card");

  function applyFilter(type) {
    // 切換 tab 外觀
    tabs.forEach(tab => {
      const isActive = tab.dataset.filter === type || (type === "all" && tab.dataset.filter === "all");
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    // 顯示 / 隱藏卡片
    cards.forEach(card => {
      const cat = card.dataset.cat;
      const match = (type === "all") || (cat === type);
      card.style.display = match ? "" : "none";
    });
  }

  // 點擊 tab 時切換
  folderBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".folder-tab");
    if (!btn) return;
    const type = btn.dataset.filter || "all";
    applyFilter(type);
  });

  // 初始顯示：全部
  applyFilter("all");
});

// === Hero 影片：在手機上盡量自動播放 ===
document.addEventListener('DOMContentLoaded', () => {
  const heroVideo = document.querySelector('.hero-banner-video');
  if (!heroVideo) return;

  // 再保險一次把屬性都設定好
  heroVideo.muted = true;
  heroVideo.autoplay = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;
  heroVideo.setAttribute('playsinline', '');
  heroVideo.setAttribute('webkit-playsinline', '');
  heroVideo.setAttribute('muted', '');

  const tryPlay = () => {
    const p = heroVideo.play();
    if (p && typeof p.then === 'function') {
      p.catch(err => {
        console.log('Autoplay blocked:', err);
      });
    }
  };

  // 1. 載入就先試一次
  tryPlay();

  // 2. canplay 時再試一次
  heroVideo.addEventListener('canplay', tryPlay);

  // 3. 任何互動（點擊 / 觸控 / 捲動）就再試播放一次
  const resumeOnInteraction = () => {
    tryPlay();
    window.removeEventListener('touchstart', resumeOnInteraction);
    window.removeEventListener('click', resumeOnInteraction);
    window.removeEventListener('scroll', resumeOnInteraction);
  };

  window.addEventListener('touchstart', resumeOnInteraction, { once: true });
  window.addEventListener('click', resumeOnInteraction, { once: true });
  window.addEventListener('scroll', resumeOnInteraction, { once: true });
});
