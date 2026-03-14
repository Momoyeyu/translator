import { Message } from '@arco-design/web-react';
import { useState } from 'react';
import { createTerm, updateTerm, type GlossaryTerm } from '../../api/project';
import './GlossaryEditor.less';

interface Props {
  projectId: string;
  terms: GlossaryTerm[];
  editable: boolean;
  onRefresh: () => void;
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  let color: string;
  let label: string;
  if (confidence >= 0.7) {
    color = 'var(--color-success, #00b42a)';
    label = 'High';
  } else if (confidence >= 0.3) {
    color = 'var(--color-warning, #ff7d00)';
    label = 'Medium';
  } else {
    color = 'var(--color-danger, #f53f3f)';
    label = 'Low';
  }

  return (
    <span className="glossary__confidence" title={`Confidence: ${Math.round(confidence * 100)}% (${label})`}>
      <span className="glossary__confidence-dot" style={{ background: color }} />
      <span className="glossary__confidence-pct">{Math.round(confidence * 100)}%</span>
    </span>
  );
}

export default function GlossaryEditor({ projectId, terms, editable, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newContext, setNewContext] = useState('');
  const [adding, setAdding] = useState(false);

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

  const handleAdd = async () => {
    if (!newSource.trim() || !newTranslation.trim()) {
      Message.warning('Source term and translation are required');
      return;
    }
    setAdding(true);
    try {
      await createTerm(projectId, {
        source_term: newSource.trim(),
        translated_term: newTranslation.trim(),
        context: newContext.trim() || undefined,
      });
      Message.success('Term added');
      setNewSource('');
      setNewTranslation('');
      setNewContext('');
      setShowAddForm(false);
      onRefresh();
    } catch {
      Message.error('Failed to add term');
    } finally {
      setAdding(false);
    }
  };

  if (terms.length === 0 && !editable) {
    return <div className="glossary__empty">No terms extracted</div>;
  }

  const confirmedCount = terms.filter((t) => t.confirmed).length;

  return (
    <div>
      <div className="glossary__header">
        <span className="glossary__title">Extracted Terms</span>
        <div className="glossary__header-right">
          <span className="glossary__count">{terms.length} terms, {confirmedCount} confirmed</span>
          {editable && (
            <button
              className="glossary__add-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add Term'}
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="glossary__add-form">
          <div className="glossary__add-form-row">
            <input
              className="glossary__add-input"
              placeholder="Source term"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
            />
            <input
              className="glossary__add-input"
              placeholder="Translation"
              value={newTranslation}
              onChange={(e) => setNewTranslation(e.target.value)}
            />
            <input
              className="glossary__add-input glossary__add-input--wide"
              placeholder="Context (optional)"
              value={newContext}
              onChange={(e) => setNewContext(e.target.value)}
            />
            <button
              className="glossary__add-submit"
              onClick={handleAdd}
              disabled={adding}
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {terms.length === 0 ? (
        <div className="glossary__empty">No terms yet. Click &quot;+ Add Term&quot; to add one.</div>
      ) : (
        <div className="glossary__table-container">
          <table className="glossary__table">
            <thead>
              <tr>
                <th>Source Term</th>
                <th>Translation</th>
                <th>Confidence</th>
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
                  <td>
                    <ConfidenceDot confidence={term.confidence} />
                  </td>
                  <td className="glossary__term-context">{term.context || '\u2014'}</td>
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
      )}
    </div>
  );
}
