import LangRedirect from "@/components/LangRedirect";

/** "/gallery/" forwards to the gallery in the visitor's language. */
export default function GalleryRedirect() {
  return <LangRedirect path="gallery/" />;
}
