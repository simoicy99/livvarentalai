import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeedGrid } from "@/components/FeedGrid";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={setSearchQuery} searchQuery={searchQuery} />
      <Hero />
      <FeedGrid searchQuery={searchQuery} />
    </div>
  );
}
