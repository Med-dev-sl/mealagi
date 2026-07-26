import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, BarChart3, Brain, Database, FileText, Globe, Shield, Target, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <AICapabilities />
      <DashboardPreview />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          AI <span className="text-primary/70">MEAL</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="#solutions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Solutions</Link>
          <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.06),transparent)]" />
      <div className="container text-center">
        <div className="mx-auto inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-sm mb-8">
          <span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">New</span>
          AI-powered MEAL platform — now in early access
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
          Intelligent{" "}
          <span className="bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
            Monitoring, Evaluation & Learning
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Streamline your MEAL processes with AI-powered data collection, analysis, and reporting.
          Make informed decisions faster with intelligent insights.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-base">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              Request Demo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="border-y py-12">
      <div className="container">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8">Trusted by leading organizations</p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
          {["UNDP", "UNICEF", "World Bank", "USAID", "Save the Children", "Oxfam"].map((name) => (
            <div key={name} className="text-lg font-bold tracking-tight">{name}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Target, title: "Results Framework", description: "Design and manage logical frameworks, theories of change, and results chains with ease." },
    { icon: BarChart3, title: "Indicator Tracking", description: "Track quantitative and qualitative indicators with automated data collection and visualization." },
    { icon: FileText, title: "Automated Reporting", description: "Generate comprehensive MEAL reports automatically with AI-powered analysis and recommendations." },
    { icon: Users, title: "Stakeholder Management", description: "Manage beneficiaries, partners, and stakeholders with built-in communication tools." },
    { icon: Globe, title: "Field Data Collection", description: "Collect data offline and online with mobile-friendly forms, GPS tagging, and media attachments." },
    { icon: Shield, title: "Compliance & Audit", description: "Maintain audit trails, ensure data integrity, and meet donor compliance requirements." },
  ];

  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need for MEAL</h2>
          <p className="mt-4 text-muted-foreground">
            A comprehensive platform designed to streamline your monitoring, evaluation, and learning processes from end to end.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="group rounded-2xl border p-6 transition-all hover:shadow-lg hover:border-primary/20">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AICapabilities() {
  const capabilities = [
    { icon: Brain, title: "Smart Data Analysis", description: "AI algorithms analyze your MEAL data to identify trends, anomalies, and actionable insights automatically." },
    { icon: Database, title: "Intelligent Data Collection", description: "Adaptive surveys and smart forms that learn from previous responses to optimize data quality." },
    { icon: FileText, title: "Automated Narrative Reports", description: "Generate donor-ready narrative reports with AI-written analysis and recommendations." },
  ];

  return (
    <section id="solutions" className="border-y bg-muted/30 py-24 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Powered by Artificial Intelligence</h2>
          <p className="mt-4 text-muted-foreground">
            Leverage cutting-edge AI to automate routine tasks and uncover deeper insights from your data.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className="rounded-2xl border bg-background p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold">{cap.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{cap.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="py-24 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">See your data come alive</h2>
          <p className="mt-4 text-muted-foreground">
            Beautiful, real-time dashboards that give you and your stakeholders instant visibility into program performance.
          </p>
        </div>
        <div className="mt-12 overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/50 to-background p-2 shadow-2xl">
          <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">Interactive Dashboard Preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Starter", price: "$29", description: "For small programs and teams", features: ["Up to 3 projects", "5 team members", "Basic reporting", "Email support"] },
    { name: "Professional", price: "$99", description: "For growing organizations", features: ["Up to 20 projects", "25 team members", "Advanced reporting", "AI-powered insights", "Priority support"], popular: true },
    { name: "Enterprise", price: "Custom", description: "For large-scale programs", features: ["Unlimited projects", "Unlimited team members", "Custom reporting", "Full AI suite", "Dedicated support", "SLA guarantee"] },
  ];

  return (
    <section id="pricing" className="border-y bg-muted/30 py-24 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">Choose the plan that fits your needs. No hidden fees.</p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.popular ? "border-primary bg-background shadow-xl ring-1 ring-primary" : "bg-background"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-0.5 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={plan.price === "Custom" ? "/contact" : "/register"}>
                <Button variant={plan.popular ? "default" : "outline"} className="mt-8 w-full">
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "What is AI MEAL?", a: "AI MEAL is an intelligent platform for Monitoring, Evaluation, Accountability, and Learning that uses artificial intelligence to streamline data collection, analysis, and reporting." },
    { q: "How does the AI feature work?", a: "Our AI analyzes your MEAL data to identify trends, generate insights, and automate report writing. It learns from your program data to provide increasingly relevant recommendations." },
    { q: "Can I collect data offline?", a: "Yes, our mobile forms support offline data collection with automatic synchronization when connectivity is restored." },
    { q: "Is my data secure?", a: "We use enterprise-grade encryption, SOC 2 compliance, and role-based access control to ensure your data is always protected." },
    { q: "Do you offer custom pricing?", a: "Yes, our Enterprise plan offers custom pricing tailored to your organization's needs. Contact our sales team for details." },
  ];

  return (
    <section id="faq" className="py-24 lg:py-32">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl">Frequently asked questions</h2>
        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border p-6 transition-all open:shadow-md">
              <summary className="flex cursor-pointer items-center justify-between text-lg font-medium">
                {faq.q}
                <span className="ml-4 shrink-0 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="container">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="text-lg font-bold mb-4">AI MEAL</h4>
            <p className="text-sm text-muted-foreground">Intelligent Monitoring, Evaluation & Learning platform.</p>
          </div>
          <div>
            <h5 className="font-semibold mb-3">Product</h5>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link>
            </div>
          </div>
          <div>
            <h5 className="font-semibold mb-3">Company</h5>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h5 className="font-semibold mb-3">Legal</h5>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-foreground transition-colors">Security</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AI MEAL. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
