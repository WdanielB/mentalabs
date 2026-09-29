"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Coreografía de la landing. Solo corre si el usuario no pidió reducir movimiento;
 * en ese caso el CSS tampoco oculta nada (ver .js .reveal en globals.css).
 */
export function LandingMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ease = "expo.out";

      gsap.timeline({ defaults: { ease } })
        .to(".reveal-word", { opacity: 1, y: 0, duration: 1.1, stagger: 0.05 })
        .to(".hero-copy .reveal", { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, "-=0.8")
        .fromTo(
          ".hero-card",
          { opacity: 0, y: 60, rotate: (i: number) => [-4, 3, -2][i] ?? 0 },
          { opacity: 1, y: 0, rotate: (i: number) => [-2, 1.5, -1][i] ?? 0, duration: 1.2, stagger: 0.14 },
          "-=0.9"
        )
        .fromTo(".hero-progress", { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: "power2.out" }, "-=0.6")
        .fromTo(".hero-mood", { scaleY: 0 }, { scaleY: 1, duration: 0.8, stagger: 0.06, ease }, "-=1");

      ScrollTrigger.batch(".reveal:not(.hero-copy .reveal)", {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease }),
      });

      // Línea de "Cómo funciona" que se dibuja con el scroll.
      gsap.fromTo(
        ".steps-line",
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".steps-list", start: "top 70%", end: "bottom 60%", scrub: 0.6 } }
      );

      // Paralaje suave de las tarjetas del hero.
      gsap.to(".hero-stack", {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    });
    return () => mm.revert();
  });

  return null;
}
