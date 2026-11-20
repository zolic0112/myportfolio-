import { notFound } from "next/navigation";

// Any address no other route claims lands here, so the site's own 404
// (with the nav, the cage and the dog) answers instead of a bare default page.
export default function Missing() {
  notFound();
}
