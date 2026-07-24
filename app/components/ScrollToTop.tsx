"use client";

import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > Math.max(window.innerHeight * 0.72, 520));
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button className={`scroll-to-top ${visible ? "is-visible" : ""}`} type="button" onClick={scrollToTop} aria-label="Cuộn về đầu trang" tabIndex={visible ? 0 : -1}>
      <span aria-hidden="true">↑</span><strong>Đầu trang</strong>
    </button>
  );
}
