import { notFound } from "next/navigation";
import About from "@/components/About";
import Certificates from "@/components/Certificates";
import Contact from "@/components/Contact";
import DetailController from "@/components/DetailController";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import MotionEngine from "@/components/MotionEngine";
import Nav from "@/components/Nav";
import Projects from "@/components/Projects";
import SmokeField from "@/components/SmokeField";
import { getContent, hasLocale } from "@/content";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const c = getContent(lang);

  return (
    <div className="root" data-root>
      <SmokeField />
      <Nav nav={c.nav} />
      <main>
        <Hero hero={c.hero} arrows={c.arrows} />
        <About about={c.about} />
        <Projects work={c.work} arrows={c.arrows} ui={c.ui} />
        <Certificates certificates={c.certificates} arrows={c.arrows} ui={c.ui} />
        <Contact contact={c.contact} arrows={c.arrows} />
      </main>
      <Footer footer={c.footer} nav={c.nav} arrows={c.arrows} />
      <MotionEngine />
      <DetailController />
    </div>
  );
}
