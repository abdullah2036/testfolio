import LangRedirect from "@/components/LangRedirect";

/** "/" has no content of its own; it forwards to /en/ or /ar/. */
export default function RootRedirect() {
  return <LangRedirect />;
}
