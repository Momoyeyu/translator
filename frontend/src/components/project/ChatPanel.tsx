import { useEffect, useRef, useState } from 'react';
import { getChatHistory, sendChatMessage, type ChatMessage } from '../../api/project';
import { useProjectStore } from '../../stores/projectStore';
import './ChatPanel.less';

interface Props {
  projectId: string;
}

export default function ChatPanel({ projectId }: Props) {
  const { chatMessages, setChatMessages, addChatMessage } = useProjectStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getChatHistory(projectId);
        const messages = res || [];
        setChatMessages(messages.reverse());
      } catch {
        // ignore
      }
    };
    fetchHistory();
  }, [projectId, setChatMessages]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistically add user message
    addChatMessage({
      id: `temp-${Date.now()}`,
      role: 'user',
      type: 'text',
      content,
      detail: null,
      created_at: new Date().toISOString(),
    });

    try {
      await sendChatMessage(projectId, content);
      // Assistant response will arrive via WebSocket
    } catch {
      // Message was already added optimistically
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel__messages" ref={messagesRef}>
        <div className="chat-panel__messages-inner">
          {chatMessages.length === 0 && !sending && (
            <div className="chat-panel__empty">
              Start a conversation about your translation...
            </div>
          )}

          {chatMessages.map((msg: ChatMessage) => (
            <div
              key={msg.id}
              className={`chat-panel__message chat-panel__message--${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className="chat-panel__message-meta">
                <span className="chat-panel__message-sender">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <span>{formatTime(msg.created_at)}</span>
              </div>
              {msg.role === 'user' ? (
                <div className="chat-panel__message-bubble">
                  {msg.content}
                </div>
              ) : (
                <div className="chat-panel__message-body">
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="chat-panel__message chat-panel__typing">
              <div className="chat-panel__message-meta">
                <span className="chat-panel__message-sender">Assistant</span>
              </div>
              <div className="chat-panel__typing-dots">
                <span className="chat-panel__typing-dot" />
                <span className="chat-panel__typing-dot" />
                <span className="chat-panel__typing-dot" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="chat-panel__input-area">
        <div className="chat-panel__input-wrapper">
          <input
            type="text"
            className="chat-panel__input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="chat-panel__send-btn"
            title="Send message"
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
