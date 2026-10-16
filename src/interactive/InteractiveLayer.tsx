"use client";

import DesktopPet from "./DesktopPet";
import GameOverlay from "./GameOverlay";

// Mounted once in the site layout, so the pet and overlays persist across
// page navigations instead of remounting.
export default function InteractiveLayer() {
  return (
    <>
      <DesktopPet />
      <GameOverlay />
    </>
  );
}
