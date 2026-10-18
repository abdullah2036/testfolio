import Studio from "@/components/studio/Studio";
import en from "@/content/en";
import "./studio.css";

export const metadata = { title: "Gallery studio", robots: { index: false } };

/** Local-only gallery editor. Exists only under `next dev`. */
export default function StudioPage() {
  const projects = en.work.projects.map((p) => ({ id: p.id, title: p.title }));
  return <Studio projects={projects} />;
}
