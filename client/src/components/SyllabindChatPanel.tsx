import { useState, useEffect, useRef, ReactNode } from 'react';
import { MessageCircle, X, Send, Maximize2, Minimize2, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolConfirmation {
  toolId: string;
  tool: string;
  message: string;
}

interface Props {
  syllabusId: number;
  onSyllabindUpdate?: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  read_current_syllabind: 'Reading syllabind...',
  web_search: 'Searching the web...',
  add_step: 'Adding step...',
  remove_step: 'Removing step...',
  update_week: 'Updating week...',
  update_basics: 'Updating syllabind...',
};

// Parse text and render clickable links
function renderMessageContent(content: string, isUser: boolean): ReactNode {
  if (isUser) {
    return content;
  }

  // Combined regex for markdown links [text](url) and plain URLs
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>)"']+)/g;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const isMarkdownLink = match[1] !== undefined;
    const linkText = isMarkdownLink ? match[1] : match[3];
    const url = isMarkdownLink ? match[2] : match[3];

    // Render the link
    parts.push(
      <a
        key={keyIndex++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:text-primary/80 break-all"
      >
        {isMarkdownLink ? linkText : truncateUrl(url)}
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

// Truncate long URLs for display
function truncateUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace('www.', '');
    const path = parsed.pathname;
    if (path.length > 20) {
      return `${domain}${path.slice(0, 17)}...`;
    }
    return `${domain}${path}`;
  } catch {
    return url.length > 40 ? url.slice(0, 37) + '...' : url;
  }
}

export function SyllabindChatPanel({ syllabusId, onSyllabindUpdate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [thinkingTool, setThinkingTool] = useState<string | null>(null);
  const [confirmTool, setConfirmTool] = useState<ToolConfirmation | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);
  const toolExecutedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || syllabusId <= 0) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/chat-syllabind/${syllabusId}`
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

        case 'tool_thinking':
          setThinkingTool(message.data.tool);
          break;

        case 'confirm_tool':
          setConfirmTool(message.data);
          setThinkingTool(null);
          break;

        case 'assistant_chunk':
          setThinkingTool(null);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && isStreamingRef.current) {
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
          isStreamingRef.current = false;
          setThinkingTool(null);
          setConfirmTool(null);
          if (toolExecutedRef.current && onSyllabindUpdate) {
            onSyllabindUpdate();
          }
          toolExecutedRef.current = false;
          break;

        case 'tool_executed':
          console.log('Tool executed:', message.data.tool);
          toolExecutedRef.current = true;
          break;

        case 'chat_cleared':
          setMessages([]);
          break;

        case 'error':
          console.error('Chat error:', message.data.message);
          setIsStreaming(false);
          isStreamingRef.current = false;
          setThinkingTool(null);
          setConfirmTool(null);
          toolExecutedRef.current = false;
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
  }, [messages, thinkingTool, confirmTool]);

  const handleSend = () => {
    if (!input.trim() || !wsRef.current || isStreaming) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsStreaming(true);
    isStreamingRef.current = true;

    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content: userMessage
    }));
  };

  const handleToolConfirmation = (approved: boolean) => {
    if (!wsRef.current || !confirmTool) return;

    wsRef.current.send(JSON.stringify({
      type: 'tool_confirmed',
      toolId: confirmTool.toolId,
      approved
    }));

    setConfirmTool(null);
    if (approved) {
      setThinkingTool(confirmTool.tool);
    }
  };

  const handleClearChat = () => {
    if (!wsRef.current || isStreaming) return;

    wsRef.current.send(JSON.stringify({
      type: 'clear_chat'
    }));
  };

  if (!isOpen) {
    return (
      <div className="ai-chat-trigger fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`fixed shadow-2xl z-50 flex flex-col transition-all duration-200 ${
      isExpanded
        ? 'inset-4 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[600px] sm:h-[80vh] w-auto h-auto'
        : 'bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-96 h-[70vh] sm:h-[600px]'
    }`}>
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium">Syllabind Assistant</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            disabled={isStreaming || messages.length === 0}
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
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
                <div className="text-sm whitespace-pre-wrap">
                  {renderMessageContent(msg.content, msg.role === 'user')}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {thinkingTool && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-muted text-muted-foreground">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{TOOL_LABELS[thinkingTool] || 'Thinking...'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation prompt */}
          {confirmTool && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-3 bg-muted">
                <p className="text-sm mb-3">{confirmTool.message}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleToolConfirmation(true)}>
                    Yes, search
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToolConfirmation(false)}>
                    No, skip
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Initial loading indicator */}
          {isStreaming && !thinkingTool && !confirmTool && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:100ms]" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:200ms]" />
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
            placeholder="Ask to modify your Syllabind..."
            disabled={isStreaming || !!confirmTool}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isStreaming || !!confirmTool}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
