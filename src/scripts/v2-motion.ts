/**
 * v2 motion: scroll reveal, the prompt flash after navigation and the theme
 * cross-fade.
 *
 * Every effect is optional by design: with JS off, or with reduced motion, the
 * page is complete and static. Nothing here hides content waiting for an
 * animation.
 */

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------------------------------------------------- scroll reveal -- */

const turns = [...document.querySelectorAll<HTMLElement>('.turn.reveal')];

if (!reduce.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-pending');
        observer.unobserve(entry.target);
      });
    },
    // The handoff says `0 0 -8% 0`, which IntersectionObserver rejects: a negative
    // percentage is not a legal rootMargin, and the constructor throws. -8% of the
    // viewport as pixels is the same intent.
    { rootMargin: `0px 0px -${Math.round(window.innerHeight * 0.08)}px 0px` }
  );

  // Only what starts below the fold is hidden: content already on screen must
  // never be invisible, not even for one frame.
  turns.forEach((turn) => {
    if (turn.getBoundingClientRect().top > window.innerHeight) {
      turn.classList.add('is-pending');
      observer.observe(turn);
    }
  });
}

/* ---------------------------------------------------------- prompt flash -- */

function flash(id: string) {
  const turn = id ? document.getElementById(id) : null;
  if (!turn?.classList.contains('turn')) return;
  turn.classList.remove('is-flash');
  void turn.offsetWidth; // restart the animation if it is already running
  turn.classList.add('is-flash');
  window.setTimeout(() => turn.classList.remove('is-flash'), 900);
}

window.addEventListener('hashchange', () => flash(location.hash.slice(1)));
window.addEventListener('tui:flash', (event) => flash((event as CustomEvent<string>).detail));

/* ------------------------------------------------------- theme cross-fade -- */

let fading = 0;
window.addEventListener('tui:skin', () => {
  if (reduce.matches) return;
  root.classList.add('theme-anim');
  window.clearTimeout(fading);
  fading = window.setTimeout(() => root.classList.remove('theme-anim'), 320);
});

export {};
