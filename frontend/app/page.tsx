'use client';

import type React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Paperclip, 
  ArrowUp, 
  Loader2, 
  Bot, 
  Sparkles, 
  BookOpen, 
  UploadCloud, 
  PlusCircle, 
  Trash2, 
  MessageSquare,
  FileText
} from 'lucide-react';
import { ExamplePrompts } from '@/components/example-prompts';
import { ChatMessage } from '@/components/chat-message';
import { FilePreview } from '@/components/file-preview';
import { client } from '@/lib/langgraph-client';
import { PDFDocument, RetrieveDocumentsNodeUpdates } from '@/types/graphTypes';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="flex h-screen w-screen overflow-hidden text-white/90">
      
      {/* Sidebar Panel - Desktop Layout */}
      <aside className="w-80 border-r border-white/10 hidden md:flex flex-col bg-white/[0.02] backdrop-blur-xl p-6 justify-between">
        <div className="space-y-6">
          
          {/* Logo / Branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight flex items-center gap-1.5 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                PDF Chat AI <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
              </h1>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400/70 font-semibold">Active Session</span>
            </div>
          </div>

          {/* Doc catalog list container */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
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
                className="w-full bg-white/5 hover:bg-white/10 hover:border-white/20 border-white/10 text-white/80 gap-2 h-11 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                )}
                {isUploading ? 'Loading Files...' : 'Add PDF Document'}
              </Button>
            </div>

            {/* Mini List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <FilePreview
                  key={`${file.name}-${idx}`}
                  file={file}
                  onRemove={() => handleRemoveFile(file)}
                />
              ))}
              {files.length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                  <FileText className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-[11px] text-white/30 text-center font-medium">No documents loaded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          <Button
            onClick={handleNewSession}
            variant="ghost"
            className="w-full justify-start text-white/55 hover:text-white hover:bg-white/5 gap-2 h-10 rounded-xl"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            New Workspace
          </Button>
          <div className="text-[10px] text-white/20 font-medium px-3">
            Local PDF RAG Chatbot v1.1
          </div>
        </div>
      </aside>

      {/* Main Chat Flow Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-black/10">
        
        {/* Mobile / Screen top-bar header */}
        <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between md:justify-end bg-white/[0.01] backdrop-blur-md">
          {/* Brand visibility on Mobile layouts */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-sm text-white">PDF Chat AI</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile upload trigger wrapper */}
            <div className="md:hidden">
              <Button
                size="icon"
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl h-10 w-10"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <UploadCloud className="w-4 h-4 text-indigo-400" />
              </Button>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">
              <div className={`w-2 h-2 rounded-full ${threadId ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              {threadId ? 'Connected' : 'Connecting'}
            </div>
          </div>
        </header>

        {/* Scrollable messages wrapper */}
        <section className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-4xl mx-auto w-full space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-between max-h-[500px]">
              <div className="flex-1 flex items-center justify-center flex-col text-center px-4">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-black/10">
                  <Bot className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="font-bold text-2xl bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  Understand your PDF documents
                </h2>
                <p className="text-white/40 text-sm max-w-md mx-auto mt-2.5 leading-relaxed">
                  Upload one or multiple files in the left workspace library panel. Ask questions, extract key concepts, or summarize long content instantly.
                </p>
              </div>

              {/* Mobile Active Files Notice */}
              {files.length > 0 && (
                <div className="md:hidden p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4 text-xs text-center flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Loaded: <span className="font-bold">{files.length} document(s)</span>
                </div>
              )}

              <ExamplePrompts onPromptSelect={setInput} />
            </div>
          ) : (
            <div className="space-y-5 pb-32">
              {messages.map((message, idx) => (
                <ChatMessage key={idx} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        {/* Input Form container */}
        <footer className="p-4 bg-gradient-to-t from-background via-background/90 to-transparent fixed bottom-0 left-0 md:left-80 right-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 focus-within:border-indigo-500/40">
              <div className="flex items-center gap-2 h-14 px-4">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isUploading 
                      ? 'Uploading to catalog...' 
                      : files.length > 0 
                        ? 'Query active documents...' 
                        : 'Send a general message or load files...'
                  }
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-full bg-transparent text-sm placeholder:text-white/35 text-white/90"
                  disabled={isUploading || isLoading || !threadId}
                />
                
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl h-10 w-10 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] shadow-lg shadow-indigo-600/20 transition-all duration-300 disabled:bg-white/5 disabled:text-white/20"
                  disabled={!input.trim() || isUploading || isLoading || !threadId}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <ArrowUp className="h-4.5 w-4.5 text-white" />
                  )}
                </Button>
              </div>
            </form>
            <div className="text-[10px] text-white/25 text-center mt-2.5 font-medium">
              Multi-user session isolated. Ingestion and chat actions apply only to your session.
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
