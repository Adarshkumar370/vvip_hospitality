import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SplitBrandSection from "@/components/SplitBrandSection";
import WhyVVIP from "@/components/WhyVVIP";
import CorporateFeature from "@/components/CorporateFeature";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background selection:bg-gold selection:text-white">
      <Navbar />
      <Hero />
      <SplitBrandSection />
      <WhyVVIP />
      <CorporateFeature />
      <Footer />
    </main>
  );
}
