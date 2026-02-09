import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  syllabusId: number;
  onCurriculumUpdate?: () => void;
}

export function CurriculumChatPanel({ syllabusId, onCurriculumUpdate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || syllabusId <= 0) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/chat-curriculum/${syllabusId}`
    );

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'init' }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'history':
          setMessages(message.data);
          break;

        case 'assistant_chunk':
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && isStreaming) {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + message.data.text }
              ];
            } else {
              return [
                ...prev,
                { role: 'assistant', content: message.data.text }
              ];
            }
          });
          break;

        case 'assistant_complete':
          setIsStreaming(false);
          if (onCurriculumUpdate) {
            onCurriculumUpdate();
          }
          break;

        case 'tool_executed':
          console.log('Tool executed:', message.data.tool);
          break;

        case 'error':
          console.error('Chat error:', message.data.message);
          setIsStreaming(false);
          break;
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [isOpen, syllabusId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !wsRef.current || isStreaming) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsStreaming(true);

    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content: userMessage
    }));
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium">Curriculum Assistant</h3>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask to modify your curriculum..."
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isStreaming}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
