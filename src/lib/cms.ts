// The CMS is live only where it can actually save: on your machine (local
// mode, `npm run dev`), or on a deployment set up for Keystatic's GitHub
// mode. A production deployment without that setup hides /keystatic and its
// API entirely, instead of serving an admin that looks open but can't save.
export const cmsEnabled =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github";
