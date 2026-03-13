import { Button, Input, Message, Table } from '@arco-design/web-react';
import { useState } from 'react';
import { updateTerm, type GlossaryTerm } from '../../api/project';

interface Props {
  projectId: string;
  terms: GlossaryTerm[];
  editable: boolean;
  onRefresh: () => void;
}

export default function GlossaryEditor({ projectId, terms, editable, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSave = async (termId: string) => {
    try {
      await updateTerm(projectId, termId, editValue);
      setEditingId(null);
      Message.success('Term updated');
      onRefresh();
    } catch {
      Message.error('Failed to update term');
    }
  };

  const columns = [
    { title: 'Source Term', dataIndex: 'source_term' },
    {
      title: 'Translation',
      dataIndex: 'translated_term',
      render: (value: string, record: GlossaryTerm) => {
        if (editingId === record.id) {
          return (
            <Input
              size="small"
              value={editValue}
              onChange={setEditValue}
              onPressEnter={() => handleSave(record.id)}
              suffix={
                <Button size="mini" type="primary" onClick={() => handleSave(record.id)}>
                  Save
                </Button>
              }
            />
          );
        }
        return (
          <span
            style={{ cursor: editable ? 'pointer' : 'default' }}
            onClick={() => {
              if (editable) {
                setEditingId(record.id);
                setEditValue(value);
              }
            }}
          >
            {value}
          </span>
        );
      },
    },
    { title: 'Context', dataIndex: 'context', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'confirmed',
      render: (confirmed: boolean) => (confirmed ? '✓ Confirmed' : 'Pending'),
    },
  ];

  return (
    <Table
      columns={columns}
      data={terms}
      rowKey="id"
      pagination={false}
      noDataElement={<div style={{ padding: 24, textAlign: 'center' }}>No terms extracted</div>}
    />
  );
}
