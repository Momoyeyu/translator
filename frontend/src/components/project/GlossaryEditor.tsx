import { Message } from '@arco-design/web-react';
import { useState } from 'react';
import { updateTerm, type GlossaryTerm } from '../../api/project';
import './GlossaryEditor.less';

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

  if (terms.length === 0) {
    return <div className="glossary__empty">No terms extracted</div>;
  }

  const confirmedCount = terms.filter((t) => t.confirmed).length;

  return (
    <div>
      <div className="glossary__header">
        <span className="glossary__title">Extracted Terms</span>
        <span className="glossary__count">{terms.length} terms, {confirmedCount} confirmed</span>
      </div>

      <div className="glossary__table-container">
        <table className="glossary__table">
          <thead>
            <tr>
              <th>Source Term</th>
              <th>Translation</th>
              <th>Context</th>
              <th style={{ width: 60, textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <tr key={term.id}>
                <td className="glossary__term-source">{term.source_term}</td>
                <td>
                  {editingId === term.id ? (
                    <div>
                      <input
                        className="glossary__edit-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(term.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                      <div className="glossary__edit-actions">
                        <button className="glossary__edit-btn glossary__edit-btn--save" onClick={() => handleSave(term.id)}>
                          Save
                        </button>
                        <button className="glossary__edit-btn glossary__edit-btn--cancel" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span
                      className={`glossary__term-translation${!editable ? ' glossary__term-translation--readonly' : ''}`}
                      onClick={() => {
                        if (editable) {
                          setEditingId(term.id);
                          setEditValue(term.translated_term);
                        }
                      }}
                    >
                      {term.translated_term}
                    </span>
                  )}
                </td>
                <td className="glossary__term-context">{term.context || '—'}</td>
                <td>
                  <div className={`glossary__term-status ${term.confirmed ? 'glossary__term-status--confirmed' : 'glossary__term-status--pending'}`}>
                    {term.confirmed ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
