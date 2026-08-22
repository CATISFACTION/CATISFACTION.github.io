import { animate, inView, stagger } from "motion";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion) {
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
    element.style.opacity = "1";
    element.style.transform = "none";
  });
} else {
  const main = document.querySelector("main");
  if (main) animate(main, { opacity: [0, 1] }, { duration: 0.32, ease: "easeOut" });

  inView(
    "[data-reveal]",
    (entry) => {
      const element = entry.target as HTMLElement;
      animate(
        element,
        { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0px)"] },
        { duration: 0.72, delay: Number(element.dataset.revealDelay ?? 0), ease: [0.22, 1, 0.36, 1] },
      );
    },
    { margin: "0px 0px -12% 0px" },
  );

  inView("[data-stagger]", (entry) => {
    const element = entry.target as HTMLElement;
    animate(
      Array.from(element.querySelectorAll("[data-stagger-item]")),
      { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] },
      { delay: stagger(0.08), duration: 0.62, ease: [0.22, 1, 0.36, 1] },
    );
  });
}
