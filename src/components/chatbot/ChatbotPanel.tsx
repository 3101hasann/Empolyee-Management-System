"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Sparkles, Send, Trash2, Loader2, PlusCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Message = {
  id?: number;
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: number;
  title: string;
};

export function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      loadConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversationMessages = async (id: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/chat?conversationId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveConvId(id);
        setShowHistory(false);
      }
    } catch (e) {
      toast.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await fetch(`/api/chat?conversationId=${id}`, { method: 'DELETE' });
      setConversations(c => c.filter(x => x.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          conversationId: activeConvId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages([...newMessages, { role: "assistant", content: data.answer, id: data.messageId }]);
      
      if (!activeConvId && data.conversationId) {
        setActiveConvId(data.conversationId);
        loadConversations();
      }
    } catch (error: any) {
      toast.error(error.message);
      // Remove the optimistic user message if failed
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <Sparkles className="absolute -top-1 -right-1 size-4 text-yellow-400" />
        <MessageCircle className="size-6" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={cn(
          "fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out md:w-[450px] border-l",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="size-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs"><Sparkles className="size-4"/></AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-background"></span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">EMS Assistant</h3>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} title="History">
               <MessageSquare className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { setActiveConvId(null); setMessages([]); setShowHistory(false); }} title="New Chat">
               <PlusCircle className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {showHistory ? (
            <div className="absolute inset-0 z-10 bg-background overflow-y-auto p-4">
              <h4 className="text-sm font-semibold mb-3">Chat History</h4>
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No previous conversations.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {conversations.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer" onClick={() => loadConversationMessages(c.id)}>
                      <span className="text-sm truncate w-[80%]">{c.title || "New Conversation"}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => deleteConversation(c.id, e)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-70">
                  <Sparkles className="size-12 mb-4 text-sidebar-primary" />
                  <h4 className="font-medium">How can I help you?</h4>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                    Ask about internees, active batches, or how to use the system.
                  </p>
                  <div className="mt-8 flex flex-col gap-2 w-full max-w-[300px]">
                    <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => setInput("How many internees are from Faisalabad?")}>
                      "How many internees are from Faisalabad?"
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => setInput("Show active batches.")}>
                      "Show active batches."
                    </Button>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                    <Avatar className="size-8 shrink-0">
                      {msg.role === "assistant" ? (
                        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs"><Sparkles className="size-4"/></AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">Me</AvatarFallback>
                      )}
                    </Avatar>
                    <div className={cn(
                      "rounded-2xl px-4 py-2 text-sm max-w-[80%]",
                      msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none whitespace-pre-wrap"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs"><Sparkles className="size-4"/></AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl px-4 py-3 bg-muted rounded-tl-none flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-foreground/50 animate-bounce" />
                    <span className="size-1.5 rounded-full bg-foreground/50 animate-bounce delay-150" />
                    <span className="size-1.5 rounded-full bg-foreground/50 animate-bounce delay-300" />
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          )}
        </div>

        {/* Footer Input */}
        <div className="p-3 border-t bg-background">
          <div className="relative flex items-end overflow-hidden rounded-xl border bg-muted/30 focus-within:ring-1 focus-within:ring-ring">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="min-h-12 w-full resize-none border-0 bg-transparent py-3 px-4 shadow-none focus-visible:ring-0 max-h-32"
              rows={1}
            />
            <Button
              size="icon"
              className="mb-1.5 mr-1.5 h-9 w-9 shrink-0 rounded-lg"
              disabled={!input.trim() || isLoading}
              onClick={handleSend}
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </div>
    </>
  );
}
