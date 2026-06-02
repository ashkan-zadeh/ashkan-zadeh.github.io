const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const progress = document.querySelector("[data-scroll-progress]");
const cursorGlow = document.querySelector("[data-cursor-glow]");
const typedTarget = document.querySelector("[data-typed-text]");
const emailScrollLinks = [...document.querySelectorAll("[data-email-scroll]")];
const contactEmail = document.querySelector("#contact-email");
const newsList = document.querySelector("[data-news-list]");
const newsMeta = document.querySelector("[data-news-meta]");
const newsCount = document.querySelector("[data-news-count]");
const newsLoading = document.querySelector("[data-news-loading]");
const newsFilters = [...document.querySelectorAll("[data-news-filter]")];
const tickerEl = document.querySelector("[data-news-ticker]");
const tickerItemsEl = document.querySelector("[data-ticker-items]");
const navLinks = [...document.querySelectorAll(".nav-links a[href^='#']")];
const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Theme switcher ─────────────────────────────────────── */
const THEMES = ["horizon", "lidar", "neural", "carbon", "spectrum"];
const themeToggle = document.querySelector("[data-theme-toggle]");
const themePanel = document.querySelector("[data-theme-panel]");
const themeOptions = [...document.querySelectorAll("[data-theme-pick]")];

function applyTheme(name, animate = true) {
    if (!THEMES.includes(name)) return;
    if (animate && !prefersReducedMotion) {
        document.documentElement.classList.add("theme-transitioning");
        window.setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 380);
    }
    document.documentElement.setAttribute("data-theme", name);
    localStorage.setItem("theme", name);
    themeOptions.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.themePick === name));
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: name } }));
}

function openThemePanel() {
    themePanel.hidden = false;
    themeToggle.setAttribute("aria-expanded", "true");
}

function closeThemePanel() {
    themePanel.hidden = true;
    themeToggle.setAttribute("aria-expanded", "false");
}

if (themeToggle && themePanel) {
    const saved = localStorage.getItem("theme") || "horizon";
    themeOptions.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.themePick === saved));

    themeToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        themePanel.hidden ? openThemePanel() : closeThemePanel();
    });

    themeOptions.forEach((btn) => {
        btn.addEventListener("click", () => {
            applyTheme(btn.dataset.themePick);
            closeThemePanel();
        });
    });

    document.addEventListener("click", (e) => {
        if (!themePanel.hidden && !themePanel.contains(e.target) && e.target !== themeToggle) {
            closeThemePanel();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !themePanel.hidden) closeThemePanel();
    });
}

/* ── Hero particle canvas ───────────────────────────────── */
(function initCanvas() {
    const canvas = document.querySelector("[data-hero-canvas]");
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    const NUM = 48;
    const CONNECT_DIST = 115;
    let particles = [];
    let heroMX = -999;
    let heroMY = -999;
    let particleColor = [53, 208, 186];

    function readThemeColor() {
        const hex = getComputedStyle(document.documentElement).getPropertyValue("--teal").trim().replace("#", "");
        if (hex.length === 6) {
            particleColor = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
        }
    }

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    function makeParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.38,
            vy: (Math.random() - 0.5) * 0.38,
            r: Math.random() * 1.4 + 0.5,
        };
    }

    function tick() {
        const { width, height } = canvas;
        const [r, g, b] = particleColor;

        ctx.clearRect(0, 0, width, height);

        for (const p of particles) {
            const dx = heroMX - p.x;
            const dy = heroMY - p.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < 18000) {
                const d = Math.sqrt(dist2);
                p.vx += (dx / d) * 0.012;
                p.vy += (dy / d) * 0.012;
            }
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.x = (p.x + p.vx + width) % width;
            p.y = (p.y + p.vy + height) % height;
        }

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECT_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist / CONNECT_DIST) * 0.22})`;
                    ctx.lineWidth = 0.7;
                    ctx.stroke();
                }
            }
        }

        ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(tick);
    }

    resize();
    readThemeColor();
    particles = Array.from({ length: NUM }, makeParticle);
    tick();

    window.addEventListener("resize", () => {
        resize();
        particles = Array.from({ length: NUM }, makeParticle);
    }, { passive: true });

    canvas.closest(".hero")?.addEventListener("pointermove", (e) => {
        const rect = canvas.getBoundingClientRect();
        heroMX = e.clientX - rect.left;
        heroMY = e.clientY - rect.top;
    }, { passive: true });

    canvas.closest(".hero")?.addEventListener("pointerleave", () => {
        heroMX = -999;
        heroMY = -999;
    }, { passive: true });

    document.addEventListener("themechange", readThemeColor);
}());

const typedPhrases = [
    "explainable automated vehicles",
    "computer vision evidence for AV decisions",
    "LLM and NLP explanation generation",
    "human-centred trust calibration",
];

const panelContent = {
    perception: {
        title: "Perception to explanation",
        body: "Connects computer vision, vehicle state, and scene context to explanation-ready evidence.",
    },
    language: {
        title: "Language as an interface",
        body: "Transforms structured AV evidence into natural language explanations that are clear, situated, and useful.",
    },
    human: {
        title: "Human-centred evaluation",
        body: "Studies whether explanations support understanding, trust calibration, and safer interaction with automated systems.",
    },
};

function setHeaderState() {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

function setScrollProgress() {
    if (!progress) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
}

setHeaderState();
setScrollProgress();
window.addEventListener("scroll", setHeaderState, { passive: true });
window.addEventListener("scroll", setScrollProgress, { passive: true });

navToggle?.addEventListener("click", () => {
    const isOpen = navMenu?.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        navMenu?.classList.remove("is-open");
        navToggle?.setAttribute("aria-expanded", "false");
    });
});

emailScrollLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        if (!contactEmail) return;

        event.preventDefault();
        contactEmail.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        window.history.pushState(null, "", link.getAttribute("href"));

        window.setTimeout(() => {
            contactEmail.focus({ preventScroll: true });
            contactEmail.classList.remove("is-highlighted");
            void contactEmail.offsetWidth;
            contactEmail.classList.add("is-highlighted");
        }, prefersReducedMotion ? 0 : 420);
    });
});

const activeObserver = new IntersectionObserver(
    (entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
        });
    },
    {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0.1, 0.35, 0.65],
    }
);

sections.forEach((section) => activeObserver.observe(section));

const revealObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    },
    { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

if (typedTarget) {
    if (prefersReducedMotion) {
        typedTarget.textContent = typedPhrases[0];
    } else {
        let phraseIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const typeNext = () => {
            const phrase = typedPhrases[phraseIndex];
            typedTarget.textContent = phrase.slice(0, charIndex);

            if (!deleting && charIndex < phrase.length) {
                charIndex += 1;
                window.setTimeout(typeNext, 44);
                return;
            }

            if (!deleting) {
                deleting = true;
                window.setTimeout(typeNext, 1200);
                return;
            }

            if (charIndex > 0) {
                charIndex -= 1;
                window.setTimeout(typeNext, 24);
                return;
            }

            deleting = false;
            phraseIndex = (phraseIndex + 1) % typedPhrases.length;
            window.setTimeout(typeNext, 260);
        };

        typeNext();
    }
}

if (cursorGlow && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
        document.documentElement.style.setProperty("--mouse-x", `${event.clientX}px`);
        document.documentElement.style.setProperty("--mouse-y", `${event.clientY}px`);
        cursorGlow.style.transform = `translate3d(${event.clientX - 9}px, ${event.clientY - 9}px, 0)`;
    }, { passive: true });

    document.querySelectorAll("a, button, [data-tilt]").forEach((element) => {
        element.addEventListener("pointerenter", () => cursorGlow.classList.add("is-active"));
        element.addEventListener("pointerleave", () => cursorGlow.classList.remove("is-active"));
    });
}

if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-2px)`;
        });

        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
}

const tabs = [...document.querySelectorAll("[data-panel-tab]")];
const panelOutput = document.querySelector("[data-panel-output]");
const researchCards = [...document.querySelectorAll("[data-research-card]")];

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const key = tab.dataset.panelTab;
        const content = panelContent[key];
        if (!content || !panelOutput) return;

        tabs.forEach((item) => {
            const active = item === tab;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-selected", String(active));
        });

        researchCards.forEach((card) => {
            card.classList.toggle("is-emphasized", card.dataset.researchCard === key);
        });

        panelOutput.innerHTML = `<strong>${content.title}</strong><p>${content.body}</p>`;
    });
});

const categoryLabels = {
    "automated-vehicles": "Automated Vehicles",
    ai: "AI",
    llm: "LLMs",
    nlp: "NLP",
    vlm: "Vision-Language Models",
    "computer-vision": "Computer Vision",
};

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
}[char]));

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recent";
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
};

const formatGeneratedAt = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Updated recently";
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
};

let newsItems = [];
let activeNewsFilter = "all";

function populateTicker() {
    if (!tickerEl || !tickerItemsEl || !newsItems.length) return;

    const items = newsItems.map((item) => `
        <span class="ticker-item" data-cat="${escapeHTML(item.category)}">
            <span class="ticker-item-cat">${escapeHTML(categoryLabels[item.category] || "News")}</span>
            <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.topic || item.title)}</a>
            <span class="ticker-sep" aria-hidden="true"></span>
        </span>`).join("");

    tickerItemsEl.innerHTML = items + items;

    const charCount = newsItems.reduce((sum, item) => sum + (item.topic || item.title || "").length, 0);
    const duration = Math.max(30, Math.round(charCount * 0.28));
    tickerItemsEl.style.animationDuration = `${duration}s`;

    tickerEl.removeAttribute("aria-hidden");
    requestAnimationFrame(() => tickerEl.classList.add("is-visible"));
}

function applyNewsFeed(feed) {
    newsItems = Array.isArray(feed?.items) ? feed.items : [];
    if (newsMeta) {
        newsMeta.textContent = formatGeneratedAt(feed?.generated_at);
    }
    if (newsLoading) {
        newsLoading.hidden = true;
    }
    populateTicker();
    renderNews();
}

function renderNews() {
    if (!newsList) return;

    const visibleItems = activeNewsFilter === "all"
        ? newsItems
        : newsItems.filter((item) => item.category === activeNewsFilter);

    if (newsCount) {
        newsCount.textContent = visibleItems.length
            ? `${visibleItems.length} article${visibleItems.length !== 1 ? "s" : ""}`
            : "";
    }

    if (!visibleItems.length) {
        newsList.innerHTML = "<div class=\"news-empty\">No articles available for this topic.</div>";
        return;
    }

    const badgeClass = (cat) => `news-badge news-badge--${escapeHTML(cat)}`;
    const renderBadge = (item) => `<span class="${badgeClass(item.category)}">${escapeHTML(categoryLabels[item.category] || "News")}</span>`;
    const renderMeta = (item) => `<span class="news-source">${escapeHTML(item.source)} · ${formatDate(item.published)}</span>`;
    const renderLink = (item) => `<a class="news-read-more" href="${escapeHTML(item.url)}" target="_blank" rel="noopener">Read article →</a>`;

    const [featured, ...rest] = visibleItems;

    const featuredCard = `
        <article class="news-card news-card--featured" data-category="${escapeHTML(featured.category)}">
            <div class="news-card-visual" aria-hidden="true"></div>
            <div class="news-card-content">
                <div class="news-card-header">
                    ${renderBadge(featured)}
                    ${renderMeta(featured)}
                </div>
                <h3>${escapeHTML(featured.topic || featured.title)}</h3>
                <p>${escapeHTML(featured.abstract || featured.summary)}</p>
                <div class="news-card-footer">
                    ${renderLink(featured)}
                </div>
            </div>
        </article>`;

    const regularCards = rest.map((item) => `
        <article class="news-card" data-category="${escapeHTML(item.category)}">
            <div class="news-card-content">
                <div class="news-card-header">
                    ${renderBadge(item)}
                    ${renderMeta(item)}
                </div>
                <h3>${escapeHTML(item.topic || item.title)}</h3>
                <p>${escapeHTML(item.abstract || item.summary)}</p>
                <div class="news-card-footer">
                    ${renderLink(item)}
                </div>
            </div>
        </article>`).join("");

    newsList.innerHTML = `<div class="news-grid">${featuredCard}${regularCards}</div>`;
}

newsFilters.forEach((filter) => {
    filter.addEventListener("click", () => {
        activeNewsFilter = filter.dataset.newsFilter || "all";
        newsFilters.forEach((item) => {
            const active = item === filter;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-selected", String(active));
        });

        newsList.classList.add("is-transitioning");
        window.setTimeout(() => {
            renderNews();
            newsList.classList.remove("is-transitioning");
        }, 180);
    });
});

if (newsList) {
    if (window.NEWS_FEED) {
        applyNewsFeed(window.NEWS_FEED);
    }

    fetch("data/news.json", { cache: "no-store" })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Feed request failed: ${response.status}`);
            }
            return response.json();
        })
        .then(applyNewsFeed)
        .catch(() => {
            if (!newsItems.length && newsMeta) {
                newsMeta.textContent = "Feed unavailable";
            }
            if (!newsItems.length) {
                newsList.innerHTML = "<div class=\"news-empty\">News feed unavailable.</div>";
            }
        });
}

/* ── Lightbox ────────────────────────────────────────────── */
(function initLightbox() {
    const lb      = document.querySelector("[data-lightbox]");
    const lbImg   = document.querySelector("[data-lightbox-img]");
    const lbClose = [...document.querySelectorAll("[data-lightbox-close]")];

    if (!lb || !lbImg) return;

    function open(src, alt) {
        lbImg.src = src;
        lbImg.alt = alt || "";
        lb.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function close() {
        lb.hidden = true;
        lbImg.src = "";
        document.body.style.overflow = "";
    }

    document.querySelectorAll("img[data-lightbox]").forEach((img) => {
        img.addEventListener("click", () => open(img.src, img.alt));
    });

    lbClose.forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !lb.hidden) close();
    });
}());
