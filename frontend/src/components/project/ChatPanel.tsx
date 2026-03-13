import { Button, Input, List, Space, Typography } from '@arco-design/web-react';
import { IconSend } from '@arco-design/web-react/icon';
import { useEffect, useRef, useState } from 'react';
import { getChatHistory, sendChatMessage, type ChatMessage } from '../../api/project';
import { useProjectStore } from '../../stores/projectStore';

interface Props {
  projectId: string;
}

export default function ChatPanel({ projectId }: Props) {
  const { chatMessages, setChatMessages, addChatMessage } = useProjectStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getChatHistory(projectId);
        const messages = (res.data.data || []) as ChatMessage[];
        setChatMessages(messages.reverse());
      } catch {
        // ignore
      }
    };
    fetchHistory();
  }, [projectId, setChatMessages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 500 }}>
      <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <List
          dataSource={chatMessages}
          render={(msg: ChatMessage) => (
            <div
              key={msg.id}
              style={{
                marginBottom: 12,
                textAlign: msg.role === 'user' ? 'right' : 'left',
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </Typography.Text>
              <div
                style={{
                  display: 'inline-block',
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: msg.role === 'user' ? '#165DFF' : '#F2F3F5',
                  color: msg.role === 'user' ? '#fff' : '#1D2129',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </div>
          )}
        />
      </div>

      <Space style={{ padding: 16, borderTop: '1px solid #E5E6EB' }}>
        <Input
          style={{ flex: 1 }}
          placeholder="Ask about the translation..."
          value={input}
          onChange={setInput}
          onPressEnter={handleSend}
        />
        <Button type="primary" icon={<IconSend />} loading={sending} onClick={handleSend}>
          Send
        </Button>
      </Space>
    </div>
  );
}
