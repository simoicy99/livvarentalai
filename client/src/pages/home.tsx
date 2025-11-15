import { Hero } from "@/components/Hero";
import { FeedGrid } from "@/components/FeedGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <FeedGrid />
    </div>
  );
}
