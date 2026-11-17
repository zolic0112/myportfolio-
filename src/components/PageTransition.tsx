import { ViewTransition } from "react";

// Wraps each page's content so route changes animate: forward (opening a
// work) recedes the old page and lifts the new one in, back does the reverse.
// The card's cover and title morph into the work page on their own (see
// interactive/MorphNames). Untyped navigations (browser back, refresh) just cut.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="page-root">{children}</div>
    </ViewTransition>
  );
}
