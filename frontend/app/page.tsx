'use client';

import type React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowUp, 
  Loader2, 
  Bot, 
  Sparkles, 
  BookOpen, 
  UploadCloud, 
  PlusCircle, 
  FileText
} from 'lucide-react';
import { ExamplePrompts } from '@/components/example-prompts';
import { ChatMessage } from '@/components/chat-message';
import { FilePreview } from '@/components/file-preview';
import { client } from '@/lib/langgraph-client';
import { PDFDocument, RetrieveDocumentsNodeUpdates } from '@/types/graphTypes';

export default function Home() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      sources?: PDFDocument[];
    }>
  >([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastRetrievedDocsRef = useRef<PDFDocument[]>([]);

  // Initialize Session ID
  useEffect(() => {
    let sid = sessionStorage.getItem('rag_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('rag_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Initialize Thread ID
  useEffect(() => {
    const initThread = async () => {
      if (threadId) return;
      try {
        const thread = await client.createThread();
        setThreadId(thread.thread_id);
      } catch (error) {
        console.error('Error creating thread:', error);
        toast({
          title: 'Initialization Error',
          description: 'Failed to establish connection. Ensure LANGGRAPH_API_URL is properly configured.',
          variant: 'destructive',
        });
      }
    };
    initThread();
  }, [threadId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewSession = async () => {
    setMessages([]);
    setFiles([]);
    setInput('');
    const newSessionId = crypto.randomUUID();
    sessionStorage.setItem('rag_session_id', newSessionId);
    setSessionId(newSessionId);
    setThreadId(null); // Triggers re-creation of thread
    toast({
      title: 'New Session Created',
      description: 'Workspace and session parameters have been refreshed.',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !threadId || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' },
    ]);
    setInput('');
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const timeoutId = setTimeout(() => abortController.abort(), 90_000);

    lastRetrievedDocsRef.current = [];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          threadId,
          sessionId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split('\n').filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const sseString = line.slice('data: '.length);
          let sseEvent: any;
          try {
            sseEvent = JSON.parse(sseString);
          } catch (err) {
            console.error('Error parsing SSE line:', err, line);
            continue;
          }

          const { event, data } = sseEvent;

          if (event === 'messages/partial') {
            if (Array.isArray(data)) {
              const lastObj = data[data.length - 1];
              if (lastObj?.type === 'ai') {
                const partialContent = lastObj.content ?? '';

                if (
                  typeof partialContent === 'string' &&
                  !partialContent.startsWith('{')
                ) {
                  setMessages((prev) => {
                    const newArr = [...prev];
                    if (
                      newArr.length > 0 &&
                      newArr[newArr.length - 1].role === 'assistant'
                    ) {
                      newArr[newArr.length - 1].content = partialContent;
                      newArr[newArr.length - 1].sources = lastRetrievedDocsRef.current;
                    }
                    return newArr;
                  });
                }
              }
            }
          } else if (event === 'updates' && data) {
            if (
              data &&
              typeof data === 'object' &&
              'retrieveDocuments' in data &&
              data.retrieveDocuments &&
              Array.isArray(data.retrieveDocuments.documents)
            ) {
              const retrievedDocs = (data as RetrieveDocumentsNodeUpdates)
                .retrieveDocuments.documents as PDFDocument[];
              lastRetrievedDocsRef.current = retrievedDocs;
            } else {
              lastRetrievedDocsRef.current = [];
            }
          } else if (event === 'error') {
            const errMsg = data?.message || data?.error || 'AI response generation failed.';
            setMessages((prev) => {
              const newArr = [...prev];
              if (newArr.length > 0 && newArr[newArr.length - 1].role === 'assistant') {
                newArr[newArr.length - 1].content = `⚠️ Backend error: ${errMsg.slice(0, 300)}`;
              }
              return newArr;
            });
            toast({
              title: 'AI Provider Error',
              description: errMsg.slice(0, 200),
              variant: 'destructive',
            });
          }
        }
      }

      // If the stream ended but the assistant never sent content, remove the
      // empty bubble to avoid a permanent "..." loading state.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      const description = isTimeout
        ? 'The request timed out. The backend is likely starting up — please try again shortly.'
        : 'Failed to process request. Ensure API keys are active.';
      toast({
        title: isTimeout ? 'Request Timeout' : 'System Error',
        description,
        variant: 'destructive',
      });
      setMessages((prev) => {
        const newArr = [...prev];
        newArr[newArr.length - 1].content = isTimeout
          ? '⏱ Server connection timed out. Please try sending your query again.'
          : 'Failed to generate response.';
        return newArr;
      });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const nonPdfFiles = selectedFiles.filter(
      (file) => file.type !== 'application/pdf',
    );
    if (nonPdfFiles.length > 0) {
      toast({
        title: 'Unsupported format',
        description: 'Only PDF documents are supported.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ingest payload rejection.');
      }

      setFiles((prev) => [...prev, ...selectedFiles]);
      toast({
        title: 'Document Catalog Updated',
        description: `Successfully loaded ${selectedFiles.length} file(s).`,
      });
    } catch (error) {
      console.error('Upload failure:', error);
      toast({
        title: 'Ingestion Failed',
        description: error instanceof Error ? error.message : 'Unknown parsing error.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(files.filter((file) => file !== fileToRemove));
    toast({
      title: 'Document Removed',
      description: `${fileToRemove.name} removed from session active catalog.`,
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030305] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar Panel - Desktop Layout */}
      <aside className="w-80 border-r border-white/5 hidden md:flex flex-col bg-[#0a0a0f]/60 backdrop-blur-3xl p-6 justify-between shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="space-y-8 relative z-10">
          
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight flex items-center gap-1.5 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                PDF Chat AI <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-indigo-400/80 font-bold">Active Workspace</span>
            </div>
          </div>

          {/* Doc catalog list container */}
          <div className="space-y-4 pt-2">
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-500 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Documents Library
            </h2>

            {/* Document upload trigger */}
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white/[0.03] hover:bg-white/[0.08] hover:border-indigo-500/30 border-white/10 text-slate-300 gap-2 h-12 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                )}
                {isUploading ? 'Ingesting...' : 'Add PDF Document'}
              </Button>
            </div>

            {/* Mini List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {files.map((file, idx) => (
                <FilePreview
                  key={`${file.name}-${idx}`}
                  file={file}
                  onRemove={() => handleRemoveFile(file)}
                />
              ))}
              {files.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                  <FileText className="w-8 h-8 text-slate-600 mb-3" />
                  <p className="text-xs text-slate-500 text-center font-medium leading-relaxed">No documents loaded.<br/>Upload to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="space-y-3 pt-6 border-t border-white/5 relative z-10">
          <Button
            onClick={handleNewSession}
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/10 gap-3 h-11 rounded-xl transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span className="font-medium">New Workspace</span>
          </Button>
          <div className="text-[10px] text-slate-600 font-medium px-4 text-center tracking-wide">
            v2.0 • Premium Edition
          </div>
        </div>
      </aside>

      {/* Main Chat Flow Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Mobile / Screen top-bar header */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between md:justify-end bg-[#0a0a0f]/40 backdrop-blur-xl z-20">
          {/* Brand visibility on Mobile layouts */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg ring-1 ring-white/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-sm text-slate-200">PDF Chat AI</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile upload trigger wrapper */}
            <div className="md:hidden">
              <Button
                size="icon"
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl h-9 w-9"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <UploadCloud className="w-4 h-4 text-indigo-400" />
              </Button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 border border-white/5 rounded-full text-[11px] font-medium text-slate-400 shadow-inner">
              <div className={`w-1.5 h-1.5 rounded-full ${threadId ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'} animate-pulse`} />
              {threadId ? 'Connected' : 'Connecting'}
            </div>
          </div>
        </header>

        {/* Scrollable messages wrapper */}
        <section className="flex-1 overflow-y-auto px-4 md:px-8 py-8 max-w-4xl mx-auto w-full space-y-6 relative z-10 scroll-smooth custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-between max-h-[600px]">
              <div className="flex-1 flex items-center justify-center flex-col text-center px-4 pt-12">
                <div className="w-20 h-20 bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                  <Bot className="w-10 h-10 text-indigo-300 relative z-10" />
                </div>
                <h2 className="font-extrabold text-3xl md:text-4xl bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent tracking-tight">
                  Understand your PDFs.
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto mt-4 leading-relaxed font-medium">
                  Upload documents to your secure workspace. Extract insights, summarize concepts, and get instant answers powered by advanced AI.
                </p>
              </div>

              {/* Mobile Active Files Notice */}
              {files.length > 0 && (
                <div className="md:hidden p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-6 text-xs text-center flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-300 font-medium">Loaded: <span className="font-bold text-white">{files.length} document(s)</span></span>
                </div>
              )}

              <div className="pb-8">
                <ExamplePrompts onPromptSelect={setInput} />
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-40">
              {messages.map((message, idx) => (
                <ChatMessage key={idx} message={message} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </section>

        {/* Input Form container */}
        <footer className="p-4 md:p-6 bg-gradient-to-t from-[#030305] via-[#030305]/95 to-transparent fixed bottom-0 left-0 md:left-80 right-0 z-30 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <form onSubmit={handleSubmit} className="relative shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-[#12121a]/80 backdrop-blur-2xl transition-all duration-300 focus-within:border-indigo-500/50 focus-within:bg-[#12121a]/95 focus-within:shadow-[0_0_30px_rgba(99,102,241,0.15)] group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-focus-within:animate-[shimmer_2s_infinite]" />
              <div className="flex items-center gap-3 h-16 px-4 relative z-10">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isUploading 
                      ? 'Processing documents...' 
                      : files.length > 0 
                        ? 'Ask anything about your documents...' 
                        : 'Send a message or load files to begin...'
                  }
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-full bg-transparent text-[15px] placeholder:text-slate-500 text-slate-200"
                  disabled={isUploading || isLoading || !threadId}
                />
                
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl h-10 w-10 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 hover:scale-105 shadow-lg shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                  disabled={!input.trim() || isUploading || isLoading || !threadId}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <ArrowUp className="h-5 w-5 text-white" />
                  )}
                </Button>
              </div>
            </form>
            <div className="text-[10px] text-slate-500 text-center mt-3 font-medium tracking-wide">
              Secure Session • Powered by Llama 3 • Responses may occasionally be inaccurate.
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
