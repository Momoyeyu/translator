import { useState } from 'react';
import type { PipelineEvent } from '../../api/events';
import './EventCard.less';

interface Props {
  event: PipelineEvent;
}

/** Maps event_type to the left-border color class suffix */
function borderVariant(eventType: string): string {
  if (eventType.endsWith('_completed') || eventType === 'artifact_created') return 'success';
  if (eventType.endsWith('_failed')) return 'error';
  if (eventType.endsWith('_started') || eventType === 'pipeline_progress') return 'info';
  if (eventType === 'chunk_translated' || eventType === 'terms_auto_confirmed') return 'success';
  if (eventType === 'chunk_translating') return 'info';
  if (eventType === 'term_extracted' || eventType === 'term_uncertain') return 'accent';
  if (eventType === 'terms_found') return 'accent';
  if (eventType === 'chunk_planned') return 'neutral';
  if (eventType === 'clarify_request') return 'warning';
  if (eventType === 'unify_result') return 'success';
  if (eventType.startsWith('tool_')) return 'tool';
  if (eventType === 'llm_thinking') return 'tool';
  return 'neutral';
}

/** Returns true if the event type should be collapsed by default */
function defaultCollapsed(eventType: string): boolean {
  return (
    eventType === 'tool_call' ||
    eventType === 'tool_call_start' ||
    eventType === 'tool_result' ||
    eventType === 'tool_call_result'
  );
}

/** Safely extract a string from unknown data field */
function str(val: unknown): string {
  if (val == null) return '';
  return String(val);
}

/** Check if an unknown value is truthy */
function has(val: unknown): boolean {
  return val != null && val !== '' && val !== false;
}

/** Renders a small icon for stage status banners */
function StatusIcon({ type }: { type: string }) {
  if (type.endsWith('_completed') || type === 'pipeline_completed') {
    return (
      <svg className="event-card__icon event-card__icon--success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (type.endsWith('_failed') || type === 'pipeline_failed') {
    return (
      <svg className="event-card__icon event-card__icon--error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  if (type.endsWith('_started')) {
    return (
      <svg className="event-card__icon event-card__icon--info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  return null;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

function formatFileSize(bytes: unknown): string {
  const n = Number(bytes);
  if (!n || isNaN(n)) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EventCard({ event }: Props) {
  const [expanded, setExpanded] = useState(!defaultCollapsed(event.event_type));
  const variant = borderVariant(event.event_type);
  const data = (event.data || {}) as Record<string, unknown>;

  const renderBody = () => {
    switch (event.event_type) {
      // ── Stage lifecycle ──
      case 'stage_started':
      case 'pipeline_stage_started':
        return (
          <div className="event-card__banner event-card__banner--info">
            <StatusIcon type={event.event_type} />
            <span>
              {has(data.message) ? str(data.message) : (
                <>Stage <strong>{event.stage}</strong> started</>
              )}
            </span>
          </div>
        );

      case 'stage_completed':
      case 'pipeline_stage_completed':
        return (
          <div className="event-card__banner event-card__banner--success">
            <StatusIcon type={event.event_type} />
            <span>Stage <strong>{event.stage}</strong> completed</span>
            {has(data.summary) && (
              <span className="event-card__banner-detail">{str(data.summary)}</span>
            )}
          </div>
        );

      case 'stage_failed':
      case 'pipeline_stage_failed':
      case 'pipeline_failed':
        return (
          <div className="event-card__banner event-card__banner--error">
            <StatusIcon type={event.event_type} />
            <span>Stage <strong>{event.stage}</strong> failed</span>
            {has(data.error) && (
              <span className="event-card__banner-detail">{str(data.error)}</span>
            )}
          </div>
        );

      case 'pipeline_completed':
        return (
          <div className="event-card__banner event-card__banner--success">
            <StatusIcon type={event.event_type} />
            <span>Pipeline completed</span>
          </div>
        );

      // ── LLM thinking ──
      case 'llm_thinking':
        return (
          <div className="event-card__thinking">
            <span className="event-card__thinking-dot" />
            <span className="event-card__thinking-text">
              {has(data.message) ? str(data.message) : has(data.preview) ? str(data.preview) : has(data.content) ? truncate(str(data.content), 120) : 'Thinking...'}
            </span>
          </div>
        );

      // ── Tool calls ──
      case 'tool_call':
      case 'tool_call_start': {
        const toolName = str(data.tool_name || data.name || 'tool');
        const query = data.input && typeof data.input === 'object' ? (data.input as Record<string, unknown>).query : null;
        return (
          <div className="event-card__collapsible" onClick={() => setExpanded(!expanded)}>
            <div className="event-card__collapsible-header">
              <span className={`event-card__chevron${expanded ? ' event-card__chevron--open' : ''}`}>
                {expanded ? '\u25BC' : '\u25B6'}
              </span>
              <span className="event-card__collapsible-title">
                <span className="event-card__tool-icon">&#128269;</span>
                <span>Calling <code>{toolName}</code></span>
                {query != null && <span className="event-card__preview">&quot;{truncate(str(query), 60)}&quot;</span>}
              </span>
            </div>
            {expanded && (
              <div className="event-card__body">
                <pre className="event-card__code">
                  {JSON.stringify(data.input || data.params || data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      }

      case 'tool_result':
      case 'tool_call_result': {
        const toolName = str(data.tool_name || data.name || 'tool');
        const resultData = data.result;
        const resultCount = Array.isArray(resultData) ? resultData.length : null;
        return (
          <div className="event-card__collapsible" onClick={() => setExpanded(!expanded)}>
            <div className="event-card__collapsible-header">
              <span className={`event-card__chevron${expanded ? ' event-card__chevron--open' : ''}`}>
                {expanded ? '\u25BC' : '\u25B6'}
              </span>
              <span className="event-card__collapsible-title">
                <span className="event-card__tool-icon event-card__tool-icon--result">&#10003;</span>
                <span>
                  {toolName} returned{resultCount != null ? ` ${resultCount} results` : ''}
                </span>
              </span>
            </div>
            {expanded && (
              <div className="event-card__body">
                <pre className="event-card__code">
                  {JSON.stringify(data.result || data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      }

      // ── Terms found ──
      case 'terms_found':
        return (
          <div className="event-card__inline-text">
            Found <strong>{str(data.count || data.total || '?')}</strong> terms
          </div>
        );

      // ── Term uncertain ──
      case 'term_uncertain': {
        const confidence = Number(data.confidence || 0);
        const confClass = confidence >= 0.7 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';
        return (
          <div className={`event-card__term-uncertain event-card__term-uncertain--${confClass}`}>
            <div className="event-card__term-row">
              <span className="event-card__term-source">{str(data.source_term)}</span>
              <svg className="event-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="event-card__term-translation">{str(data.translated_term)}</span>
              <span className={`event-card__confidence event-card__confidence--${confClass}`}>
                {Math.round(confidence * 100)}%
              </span>
            </div>
            {has(data.context) && (
              <div className="event-card__term-context">{truncate(str(data.context), 200)}</div>
            )}
          </div>
        );
      }

      // ── Term extracted (legacy) ──
      case 'term_extracted':
        return (
          <div className="event-card__term-row">
            <span className="event-card__term-source">{str(data.source_term)}</span>
            <svg className="event-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span className="event-card__term-translation">{str(data.translated_term)}</span>
            {data.confidence != null && (
              <span className={`event-card__confidence event-card__confidence--${Number(data.confidence) >= 0.8 ? 'high' : Number(data.confidence) >= 0.5 ? 'medium' : 'low'}`}>
                {Math.round(Number(data.confidence) * 100)}%
              </span>
            )}
          </div>
        );

      // ── Terms auto-confirmed ──
      case 'terms_auto_confirmed':
        return (
          <div className="event-card__inline-text event-card__inline-text--success">
            <svg className="event-card__icon event-card__icon--success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <strong>{str(data.count || data.total || '?')}</strong> terms auto-confirmed (high confidence)
          </div>
        );

      // ── Chunk planned ──
      case 'chunk_planned': {
        const chunkIdx = data.chunk_index != null ? Number(data.chunk_index) + 1 : data.index != null ? Number(data.index) + 1 : '?';
        const sourcePreview = str(data.source_text || data.preview || data.content || '');
        return (
          <div className="event-card__chunk">
            <div className="event-card__chunk-header">
              <span className="event-card__chunk-badge">Chunk {chunkIdx}</span>
            </div>
            {sourcePreview && (
              <div className="event-card__chunk-preview">{truncate(sourcePreview, 150)}</div>
            )}
          </div>
        );
      }

      // ── Chunk translating ──
      case 'chunk_translating': {
        const chunkIdx = data.chunk_index != null ? Number(data.chunk_index) + 1 : data.index != null ? Number(data.index) + 1 : '?';
        const total = data.total_chunks || data.total || '?';
        const sourcePreview = str(data.source_text || data.preview || '');
        return (
          <div className="event-card__thinking">
            <span className="event-card__thinking-dot" />
            <span className="event-card__thinking-text">
              Translating chunk {chunkIdx} of {str(total)}...
            </span>
            {sourcePreview && (
              <div className="event-card__chunk-preview">{truncate(sourcePreview, 120)}</div>
            )}
          </div>
        );
      }

      // ── Chunk translated ──
      case 'chunk_translated': {
        const chunkIdx = data.chunk_index != null ? Number(data.chunk_index) + 1 : data.index != null ? Number(data.index) + 1 : '?';
        const source = str(data.source_text || data.source || data.content || '');
        const translated = str(data.translated_text || data.translated || data.translation || '');
        return (
          <div className="event-card__chunk">
            <div className="event-card__chunk-header">
              <span className="event-card__chunk-badge">Chunk {chunkIdx}</span>
            </div>
            <div className="event-card__chunk-grid">
              <div className="event-card__chunk-source">
                <span className="event-card__chunk-label">Source</span>
                <div className="event-card__chunk-text">{source}</div>
              </div>
              <div className="event-card__chunk-translated">
                <span className="event-card__chunk-label">Translation</span>
                <div className="event-card__chunk-text">{translated}</div>
              </div>
            </div>
          </div>
        );
      }

      // ── Unify result ──
      case 'unify_result': {
        const preview = str(data.content || data.markdown || data.preview || '');
        return (
          <div className="event-card__unify">
            <div className="event-card__banner event-card__banner--success">
              <StatusIcon type="stage_completed" />
              <span>Document assembled</span>
            </div>
            {preview && (
              <div className="event-card__unify-preview">{truncate(preview, 300)}</div>
            )}
          </div>
        );
      }

      // ── Artifact created ──
      case 'artifact_created':
        return (
          <div className="event-card__artifact">
            <svg className="event-card__icon event-card__icon--success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="event-card__artifact-info">
              <span className="event-card__artifact-title">{str(data.title || 'Artifact')}</span>
              {has(data.format) && (
                <span className="event-card__artifact-format">{str(data.format).toUpperCase()}</span>
              )}
              {has(data.file_size) && (
                <span className="event-card__artifact-size">{formatFileSize(data.file_size)}</span>
              )}
            </div>
          </div>
        );

      // ── Clarify request ──
      case 'clarify_request': {
        const count = data.count || data.total || '?';
        return (
          <div className="event-card__banner event-card__banner--warning">
            <svg className="event-card__icon event-card__icon--warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span><strong>{str(count)}</strong> terms need your review</span>
          </div>
        );
      }

      // ── Pipeline progress ──
      case 'pipeline_progress':
        return (
          <div className="event-card__banner event-card__banner--info">
            <StatusIcon type="stage_started" />
            <span>
              {has(data.message)
                ? str(data.message)
                : `Progress: ${event.stage}`}
            </span>
          </div>
        );

      // ── Pipeline cancelled ──
      case 'pipeline_cancelled':
        return (
          <div className="event-card__banner event-card__banner--warning">
            <svg className="event-card__icon event-card__icon--warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>Pipeline cancelled</span>
          </div>
        );

      // ── Default fallback ──
      default:
        return (
          <div className="event-card__collapsible" onClick={() => setExpanded(!expanded)}>
            <div className="event-card__collapsible-header">
              <span className={`event-card__chevron${expanded ? ' event-card__chevron--open' : ''}`}>
                {expanded ? '\u25BC' : '\u25B6'}
              </span>
              <span className="event-card__collapsible-title">{event.event_type}</span>
            </div>
            {expanded && Object.keys(data).length > 0 && (
              <pre className="event-card__code">{JSON.stringify(data, null, 2)}</pre>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`event-card event-card--${variant}`}>
      <div className="event-card__timestamp">{formatTimestamp(event.created_at)}</div>
      {renderBody()}
    </div>
  );
}
