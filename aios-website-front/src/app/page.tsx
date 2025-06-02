import Layout from "@/components/Layout";
import Hero from "@/components/home/Hero";
import KeyCapabilities from "@/components/home/KeyCapabilities";
import McpPreview from "@/components/home/McpPreview";
import FinalCTA from "@/components/home/FinalCTA";

export default function Home() {
  return (
    <Layout>
      <Hero />
      <KeyCapabilities />
      <McpPreview />
      <FinalCTA />
    </Layout>
  );
}
