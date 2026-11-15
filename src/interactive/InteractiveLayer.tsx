"use client";

import { useEffect } from "react";
import Ambient from "./Ambient";
import { CageBack, CageFront } from "./Cage";
import FxLayer from "./FxLayer";
import GameOverlay from "./GameOverlay";
import Hatch from "./Hatch";
import Popups from "./Popups";
import PremiumModal, { type Sponsor } from "./PremiumModal";
import SpaceDog from "./SpaceDog";
import { useInteractive } from "./store";

// Mounted once in the site layout, so the dog, cage and popups persist across
// page navigations instead of remounting.
export default function InteractiveLayer({
  links,
  reels,
  memes,
  sponsor,
}: {
  links: string[];
  /** Hand-curated short video URLs for the Reels popup. */
  reels: string[];
  /** Meme images for the meme popup. */
  memes: string[];
  sponsor: Sponsor;
}) {
  const hydrate = useInteractive((s) => s.hydrate);
  useEffect(hydrate, [hydrate]);
  return (
    <>
      <Ambient />
      <Popups links={links} reels={reels} memes={memes} />
      <PremiumModal sponsor={sponsor} />
      <GameOverlay />
      <CageBack />
      <SpaceDog />
      <FxLayer />
      <CageFront />
      <Hatch />
    </>
  );
}
