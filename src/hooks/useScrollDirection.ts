import { useState, useEffect } from "react";

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    null
  );
  const [prevOffset, setPrevOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const scrollContainer = document.getElementById("main-scroll") || window;

    const toggleScrollDirection = () => {
      let scrollY = 0;
      if (scrollContainer === window) {
        scrollY = window.pageYOffset;
      } else {
        scrollY = (scrollContainer as HTMLElement).scrollTop;
      }

      if (scrollY <= 0) {
        setScrollDirection(null);
        setIsVisible(true);
        setPrevOffset(0);
        return;
      }

      if (scrollY > prevOffset && scrollY > 50) {
        setScrollDirection("down");
        setIsVisible(false);
      } else if (scrollY < prevOffset) {
        setScrollDirection("up");
        setIsVisible(true);
      }
      setPrevOffset(scrollY);
    };

    scrollContainer.addEventListener("scroll", toggleScrollDirection, {
      passive: true,
    });
    return () => {
      scrollContainer.removeEventListener("scroll", toggleScrollDirection);
    };
  }, [prevOffset]);

  return isVisible;
}
