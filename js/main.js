const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const navLinks = [...document.querySelectorAll(".nav-links a[href^='#']")];
const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

function setHeaderState() {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

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
