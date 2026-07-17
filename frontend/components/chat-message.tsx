import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { PDFDocument } from '@/types/graphTypes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    sources?: PDFDocument[];
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const isLoading = message.role === 'assistant' && message.content === '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const showSources =
    message.role === 'assistant' &&
    message.sources &&
    message.sources.length > 0;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white border border-indigo-500/20'
            : 'bg-white/5 backdrop-blur-md border border-white/10 text-white/90 shadow-black/10'
        }`}
      >
        {isLoading ? (
          <div className="flex space-x-1.5 h-6 items-center px-1.5">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[loading_1s_ease-in-out_infinite]" />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[loading_1s_ease-in-out_0.2s_infinite]" />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[loading_1s_ease-in-out_0.4s_infinite]" />
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed select-text">{message.content}</p>
            {!isUser && (
              <div className="flex gap-2 mt-2.5 border-t border-white/5 pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-lg"
                  onClick={handleCopy}
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  <Copy
                    className={`h-3.5 w-3.5 ${copied ? 'text-emerald-400' : ''}`}
                  />
                </Button>
              </div>
            )}
            {showSources && message.sources && (
              <Accordion type="single" collapsible className="w-full mt-2.5 border-t border-white/5 pt-1">
                <AccordionItem value="sources" className="border-b-0">
                  <AccordionTrigger className="text-xs text-white/40 py-2 justify-start gap-2 hover:no-underline hover:text-white/60 transition-colors">
                    Cited Sources ({message.sources.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {message.sources?.map((source, index) => (
                        <Card
                          key={index}
                          className="bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5"
                        >
                          <CardContent className="p-3">
                            <p className="text-xs font-semibold text-white/80 truncate">
                              {source.metadata?.source ||
                                source.metadata?.filename ||
                                'Document'}
                            </p>
                            <p className="text-[11px] text-white/40 mt-1 font-medium">
                              Page {source.metadata?.loc?.pageNumber || 'N/A'}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </>
        )}
      </div>
    </div>
  );
}
