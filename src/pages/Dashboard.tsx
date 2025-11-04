import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Dashboard() {
  return (
    <div className="container-page py-8 space-y-6">
      {/* GEN:HERO-START */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-5xl font-bold" style={{ color: "hsl(var(--fg))" }}>
          Welcome to <span style={{ color: "hsl(var(--brand))" }}>Module</span>
        </h1>
        <p className="text-lg" style={{ color: "hsl(var(--muted))" }}>
          Build, learn, and create with AI-powered code generation
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button variant="primary">Get Started</Button>
          <Button variant="ghost">Learn More</Button>
        </div>
      </div>
      {/* GEN:HERO-END */}

      {/* GEN:FEATURES-START */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
          <p style={{ color: "hsl(var(--muted))" }}>
            Generate production-ready code with advanced AI models
          </p>
        </Card>
        <Card>
          <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
          <p style={{ color: "hsl(var(--muted))" }}>
            Build complete applications in minutes, not hours
          </p>
        </Card>
        <Card>
          <h3 className="text-xl font-semibold mb-2">Production Ready</h3>
          <p style={{ color: "hsl(var(--muted))" }}>
            Clean, maintainable code that's ready to deploy
          </p>
        </Card>
      </div>
      {/* GEN:FEATURES-END */}
    </div>
  );
}
