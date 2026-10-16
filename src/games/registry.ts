import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type GameProps = { onExit: () => void };

type GameEntry = {
  title: string;
  component: LazyExoticComponent<ComponentType<GameProps>>;
};

// Each game is code-split, so it only downloads when the pet or a work page
// launches it. Add a game: create src/games/<id>/index.tsx and register it here.
export const games: Record<string, GameEntry> = {
  "click-rush": {
    title: "Click Rush",
    component: lazy(() => import("./click-rush")),
  },
};

export const gameIds = Object.keys(games);
