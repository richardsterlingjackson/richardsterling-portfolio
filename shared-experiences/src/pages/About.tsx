import { useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import aboutPortrait from "@/assets/about-portrait.webp";

export default function About() {
  useEffect(() => {
    document.title = "About – Shared Experiences";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <Sidebar />
          </div>
          <div className="lg:col-span-9 space-y-12">
            <section className="space-y-6">
              <h1 className="text-3xl sm:text-5xl font-playfair font-bold text-elegant-text tracking-tight">
                About This Blog
              </h1>
              <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
                <div
                  className="w-full max-w-[220px] border border-border bg-white"
                  style={{ boxShadow: "0 6px 8px rgba(0, 0, 0, 0.7)" }}
                >
                  <img
                    src={aboutPortrait}
                    alt="Portrait"
                    className="w-full rounded-none object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-4">
                  <p className="text-lg text-elegant-text-light leading-relaxed max-w-3xl">
                    Welcome to <span className="font-semibold text-elegant-text">Shared Experiences</span> — a personal portfolio and technical journal built to showcase my work as a full-stack developer and machine learning enthusiast. This space is where I explore ideas, document experiments, and share insights from the projects I build.
                  </p>
                  <h2 className="text-xl sm:text-2xl font-playfair font-semibold text-elegant-text">
                    About This Space
                  </h2>
                  <p className="text-md text-muted-foreground max-w-2xl">
                    The blog itself is part of a larger portfolio ecosystem, including projects like <span className="font-semibold text-elegant-text">profile-card</span>, a modular identity component with resume integration, and <span className="font-semibold text-elegant-text">Connect</span>, a region-based dating platform built with React and Vite. All of these live in the same GitHub repo and reflect my commitment to emotionally resonant design, robust architecture, and thoughtful engineering.
                  </p>
                  <p className="text-md text-muted-foreground max-w-2xl">
                    Every page here is crafted to feel cohesive, from the hero banner to the search results. There is a focus on relatability, clarity, storytelling, and emotional impact. I believe technical work should be expressive, easily accessible, and memorable.
                  </p>
                  <p className="text-md text-muted-foreground max-w-2xl">
                    College taught me a lot about stress, deadlines, and discipline... but reflecting deeper, I find it's the most <span className="font-semibold text-elegant-text">human</span> parts of us show up in the cracks between our responsibilities. The late‑night conversations, the shared frustrations, the collective confusion, those were the moments that shaped me just as much as any lecture or exam. They made me realize how deeply we rely on each other, even when we pretend we’re doing everything on our own.
                  </p>
                  <p className="text-md text-muted-foreground max-w-2xl">
                    That’s partly of why I created Shared Experiences. I’ve always believed that storytelling is a bridge that connects people who may never cross paths but somehow understand each other anyway. Whether I’m writing about college chaos, emotional growth, or the small everyday glitches we all stumble through, my goal is the same... to make someone out there feel a little less alone in whatever season they’re navigating.
                  </p>
                  <p className="text-md text-muted-foreground max-w-2xl">
                    In growth, I’ve learned that connection doesn’t require grand gestures or perfect timing. It requires honesty and the willingness to say: this is what I went through, and maybe you did too. If my words can give someone a moment of recognition, a breath of relief, or even a quiet laugh at how universal our struggles really are, then this space is doing exactly what I hoped it would. This blog isn’t just storytelling, it’s about the threads in life that tie us together.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 text-muted-foreground">
              <div>
                <span className="font-semibold text-elegant-text">GitHub:</span>{" "}
                <a
                  href="https://github.com/richardsterlingjackson"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  github.com/richardsterlingjackson
                </a>
              </div>
              <div>
                <span className="font-semibold text-elegant-text">LinkedIn:</span>{" "}
                <a
                  href="https://linkedin.com/in/richardsterlingjackson"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  linkedin.com/in/richardsterlingjackson
                </a>
              </div>
              <div>
                <span className="font-semibold text-elegant-text">Resume:</span>{" "}
                <a
                  href="https://github.com/richardsterlingjackson/richardsterling-portfolio/blob/main/profile-card/src/assets/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View Resume on GitHub
                </a>{" "}
                |{" "}
                <a
                  href="https://raw.githubusercontent.com/richardsterlingjackson/richardsterling-portfolio/main/profile-card/src/assets/resume.pdf"
                  download
                  className="underline"
                >
                  Download PDF
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Shared Experiences. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
