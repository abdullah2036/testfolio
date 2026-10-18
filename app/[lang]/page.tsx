import { notFound } from "next/navigation";
import About from "@/components/About";
import Beyond from "@/components/Beyond";
import Certificates from "@/components/Certificates";
import Contact from "@/components/Contact";
import DetailController from "@/components/DetailController";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Motion from "@/components/Motion";
import Nav from "@/components/Nav";
import Projects from "@/components/Projects";
import Tape from "@/components/Tape";
import { getContent, hasLocale } from "@/content";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const c = getContent(lang);

  return (
    <>
      <Nav nav={c.nav} locale={lang} page="home" />
      <main>
        <Hero c={c} />
        <Tape label={c.tape.label} />
        <Projects work={c.work} arrows={c.arrows} ui={c.ui} locale={lang} />
        <About about={c.about} locale={lang} />
        <Beyond c={c} />
        <Certificates certificates={c.certificates} arrows={c.arrows} ui={c.ui} />
        <Contact contact={c.contact} arrows={c.arrows} />
      </main>
      <Footer c={c} page="home" />
      <Motion />
      <DetailController />
    </>
  );
}
