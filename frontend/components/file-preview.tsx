import { FileIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilePreviewProps {
  file: File
  onRemove: () => void
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  return (
    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2.5 shadow-lg transition-all duration-300 hover:bg-white/10">
      <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-lg flex items-center justify-center shadow-inner">
        <FileIcon className="w-5 h-5 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-white/90">{file.name}</p>
        <p className="text-xs text-white/40">PDF Document</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-lg"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
