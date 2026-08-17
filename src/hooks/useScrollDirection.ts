import { useState, useEffect } from "react";

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    null
  );
  const [prevOffset, setPrevOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const toggleScrollDirection = () => {
      let scrollY = window.pageYOffset;
      if (scrollY === 0) {
        setScrollDirection(null);
        setIsVisible(true);
        setPrevOffset(scrollY);
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

    window.addEventListener("scroll", toggleScrollDirection);
    return () => {
      window.removeEventListener("scroll", toggleScrollDirection);
    };
  }, [prevOffset]);

  return isVisible;
}
