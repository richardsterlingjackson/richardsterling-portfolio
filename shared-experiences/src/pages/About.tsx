import { useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

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
              <h1 className="text-5xl font-playfair font-bold text-elegant-text tracking-tight">
                About This Blog
              </h1>
              <p className="text-lg text-elegant-text-light leading-relaxed max-w-3xl">
                Welcome to <span className="font-semibold text-elegant-text">Shared Experiences</span> — a personal portfolio and technical journal built to showcase my work as a full-stack developer and machine learning enthusiast. This space is where I explore ideas, document experiments, and share insights from the projects I build.
              </p>
              <p className="text-md text-muted-foreground max-w-2xl">
                The blog itself is part of a larger portfolio ecosystem, including projects like <span className="font-semibold text-elegant-text">profile-card</span>, a modular identity component with resume integration, and <span className="font-semibold text-elegant-text">Connect</span>, a region-based dating platform built with React and Vite. All of these live in the same GitHub repo and reflect my commitment to emotionally resonant design, robust architecture, and thoughtful engineering.
              </p>
              <p className="text-md text-muted-foreground max-w-2xl">
                Every page here is crafted to feel cohesive — from the hero banner to the search results — with a focus on clarity, storytelling, and visual impact. I believe technical work should be expressive, accessible, and memorable.
              </p>
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
            © 2025 shared-experiences. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
