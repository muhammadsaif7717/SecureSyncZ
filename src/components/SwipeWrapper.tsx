"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export function SwipeWrapper({ children }: { children: React.ReactNode }) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const routes = ["/", "/cards", "/passwords", "/notes", "/add", "/health"];

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;

    // Only apply on mobile/tablet (width < 1024px)
    if (window.innerWidth >= 1024) return;
    // Only apply if user is logged in
    if (!user) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const currentIndex = routes.findIndex((route) => {
      if (route === "/") return pathname === "/";
      return pathname.startsWith(route);
    });

    if (currentIndex === -1) return;

    if (isLeftSwipe && currentIndex < routes.length - 1) {
      router.push(routes[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      router.push(routes[currentIndex - 1]);
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
      className="flex h-full w-full flex-1 flex-col"
    >
      {children}
    </div>
  );
}
