import { Card } from "@/components/ui/card"
import { Sparkles, FileText, Search, Zap } from "lucide-react"

interface ExamplePromptsProps {
  onPromptSelect: (prompt: string) => void
}

const EXAMPLE_PROMPTS = [
  {
    title: "Summarize this document",
    icon: <FileText className="w-4 h-4 text-emerald-400" />
  },
  {
    title: "Find the key takeaways",
    icon: <Zap className="w-4 h-4 text-amber-400" />
  },
  {
    title: "Explain the main concept",
    icon: <Sparkles className="w-4 h-4 text-indigo-400" />
  },
  {
    title: "Search for specific terms",
    icon: <Search className="w-4 h-4 text-rose-400" />
  }
]

export function ExamplePrompts({ onPromptSelect }: ExamplePromptsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto">
      {EXAMPLE_PROMPTS.map((prompt, i) => (
        <Card 
          key={i} 
          className="group relative overflow-hidden bg-white/[0.02] border-white/5 p-4 cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-black/5"
          onClick={() => onPromptSelect(prompt.title)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
              {prompt.icon}
            </div>
            <p className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">{prompt.title}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

