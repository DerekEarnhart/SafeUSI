import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Code2, 
  Play, 
  Brain,
  ArrowLeft,
  Copy,
  Download,
  Sparkles,
  FileCode,
  Terminal,
  Home,
  Settings,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Sample code templates
const CODE_TEMPLATES = {
  python: `# Python Example
def hello_world():
    """A simple hello world function"""
    print("Hello from WSM AI!")
    return "Success"

if __name__ == "__main__":
    result = hello_world()
    print(f"Result: {result}")`,
  
  javascript: `// JavaScript Example
function helloWorld() {
  console.log("Hello from WSM AI!");
  return "Success";
}

const result = helloWorld();
console.log(\`Result: \${result}\`);`,
  
  wsm: `# WSM Harmonic Framework
import numpy as np

class HarmonicState:
    def __init__(self, coherence=0.95, resonance=0.85):
        self.coherence = coherence
        self.resonance = resonance
        self.golden_ratio = (1 + np.sqrt(5)) / 2
    
    def compute_energy(self):
        return self.coherence * self.resonance * self.golden_ratio

# Initialize WSM state
state = HarmonicState()
energy = state.compute_energy()
print(f"Harmonic Energy: {energy:.4f}")`
};

export default function Programming() {
  const [code, setCode] = useState(CODE_TEMPLATES.python);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState<"python" | "javascript" | "wsm">("python");
  const { toast } = useToast();

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("Running code...\n");
    
    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate simulated output based on language
    let simulatedOutput = "";
    if (language === "python" || language === "wsm") {
      simulatedOutput = `>>> Executing Python code...
Hello from WSM AI!
Result: Success

Process completed successfully.
Execution time: 0.023s`;
    } else {
      simulatedOutput = `> Executing JavaScript...
Hello from WSM AI!
Result: Success

Process completed successfully.
Execution time: 0.015s`;
    }
    
    setOutput(simulatedOutput);
    setIsRunning(false);
    
    toast({
      title: "Code Executed",
      description: "Your code ran successfully",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const handleDownload = () => {
    const extension = language === "javascript" ? "js" : "py";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: `Code saved as code.${extension}`,
    });
  };

  const handleTemplateChange = (newLang: "python" | "javascript" | "wsm") => {
    setLanguage(newLang);
    setCode(CODE_TEMPLATES[newLang]);
    setOutput("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-2">
                <Code2 className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Code Editor
                </h1>
                <p className="text-xs text-slate-400">WSM Programming Environment</p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/commercial">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <DollarSign className="h-4 w-4 mr-2" />
                  API
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-green-400" />
                    Code Editor
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopy}
                      className="border-slate-700"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownload}
                      className="border-slate-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button 
                      onClick={handleRun}
                      disabled={isRunning}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {isRunning ? "Running..." : "Run"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Language Tabs */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={language === "python" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTemplateChange("python")}
                    className={language === "python" ? "bg-blue-600" : "border-slate-700"}
                  >
                    Python
                  </Button>
                  <Button
                    variant={language === "javascript" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTemplateChange("javascript")}
                    className={language === "javascript" ? "bg-yellow-600" : "border-slate-700"}
                  >
                    JavaScript
                  </Button>
                  <Button
                    variant={language === "wsm" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTemplateChange("wsm")}
                    className={language === "wsm" ? "bg-purple-600" : "border-slate-700"}
                  >
                    WSM Framework
                  </Button>
                </div>

                {/* Code Input */}
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono text-sm bg-slate-950 border-slate-700 text-green-400 min-h-[400px] resize-none"
                  placeholder="Write your code here..."
                />
              </CardContent>
            </Card>

            {/* Output */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-amber-400" />
                  Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 min-h-[150px]">
                  <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap">
                    {output || "Output will appear here after running your code..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  WSM Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Engine</span>
                  <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Coherence</span>
                  <span className="text-white font-mono">0.947</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Compression</span>
                  <span className="text-white font-mono">8.3x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Language</span>
                  <Badge variant="outline" className="border-slate-600 text-slate-300 capitalize">
                    {language}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>• Use the templates to get started quickly</li>
                  <li>• WSM Framework includes harmonic computing utilities</li>
                  <li>• Code is executed in a sandboxed environment</li>
                  <li>• Download your code to save locally</li>
                </ul>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full justify-start border-slate-700">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <Link href="/commercial">
                  <Button variant="outline" className="w-full justify-start border-slate-700">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Commercial API
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
