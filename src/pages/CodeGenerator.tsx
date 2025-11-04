import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function CodeGenerator() {
  return (
    <div className="container-page py-8 space-y-6">
      {/* GEN:REQUEST-UI-START */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Generate Your Code</h2>
        <form className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input placeholder="Project title" />
            <select className="input">
              <option>Landing Page</option>
              <option>Portfolio</option>
              <option>Dashboard</option>
              <option>E-commerce</option>
            </select>
          </div>
          <textarea
            className="input min-h-32"
            placeholder="Describe sections, vibe, and brand colors…"
          />
          <div className="flex items-center gap-3">
            <Button type="submit">Generate UI</Button>
            <Button type="button" variant="ghost">
              Refine
            </Button>
          </div>
        </form>
      </Card>
      {/* GEN:REQUEST-UI-END */}

      {/* GEN:RESULTS-START */}
      <Card className="overflow-hidden">
        <h2 className="text-lg font-semibold mb-2">Live Preview</h2>
        <div className="h-[60vh] rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <p style={{ opacity: 0.7 }}>Preview will appear here…</p>
        </div>
      </Card>
      {/* GEN:RESULTS-END */}
    </div>
  );
}
