import { useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function Contact() {
  useEffect(() => {
    document.title = "Contact – Shared Experiences";
  }, []);

  const emailUser = "richard.sterling.jackson";
  const emailDomain = "gmail.com";

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
                Let’s Connect
              </h1>
              <p className="text-lg text-elegant-text-light leading-relaxed max-w-3xl">
                Welcome to my digital workspace — a living journal of ideas, experiments, and technical storytelling. I'm Richard Sterling Jackson, an aspiring engineer with a passion for full-stack development and machine learning. Whether you're here to explore, collaborate, or simply say hello, I’d love to hear from you.
              </p>
              <p className="text-md text-muted-foreground max-w-2xl">
                Feel free to reach out through any of the links below. I’m always open to meaningful conversations, creative projects, and opportunities to build something impactful.
              </p>
            </section>

            <section className="space-y-4 text-muted-foreground">
              <div>
                <span className="font-semibold text-elegant-text">Email:</span>{" "}
                <a
                  href={`mailto:${emailUser}@${emailDomain}`}
                  onClick={(e) => {
                    e.currentTarget.href = `mailto:${emailUser}@${emailDomain}`;
                  }}
                  className="underline"
                >
                  {emailUser} [at] {emailDomain}
                </a>
              </div>
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
                <span className="font-semibold text-elegant-text">Resume (view online):</span>{" "}
                <a
                  href="https://github.com/richardsterlingjackson/richardsterling-portfolio/blob/main/profile-card/src/assets/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View Resume on GitHub
                </a>
              </div>
              <div>
                <span className="font-semibold text-elegant-text">Resume (download):</span>{" "}
                <a
                  href="https://raw.githubusercontent.com/richardsterlingjackson/richardsterling-portfolio/main/profile-card/src/assets/resume.pdf"
                  download
                  className="underline"
                >
                  Download Resume PDF
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
