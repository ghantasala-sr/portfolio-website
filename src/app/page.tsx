import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Education from "@/components/Education";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Footer from "@/components/Footer";
import NetworkBackground from "@/components/NetworkBackground";

export default function Home() {
  return (
    <main className="relative">
      <NetworkBackground />
      <Navbar />

      <Hero />

      <div className="section-divider" />
      <Experience />

      <div className="section-divider" />
      <Education />

      <div className="section-divider" />
      <Projects />

      <div className="section-divider" />
      <Skills />

      <Footer />
    </main>
  );
}
