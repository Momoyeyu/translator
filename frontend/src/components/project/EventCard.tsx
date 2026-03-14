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
  if (eventType === 'chunk_translated') return 'success';
  if (eventType === 'term_extracted') return 'accent';
  if (eventType === 'chunk_planned') return 'neutral';
  if (eventType === 'clarify_request') return 'warning';
  if (eventType.startsWith('tool_call')) return 'tool';
  if (eventType === 'llm_thinking') return 'tool';
  return 'neutral';
}

/** Returns true if the event type should be collapsed by default */
function defaultCollapsed(eventType: string): boolean {
  return (
    eventType.startsWith('tool_call') ||
    eventType === 'llm_thinking' ||
    eventType === 'chunk_planned'
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

export default function EventCard({ event }: Props) {
  const [expanded, setExpanded] = useState(!defaultCollapsed(event.event_type));
  const variant = borderVariant(event.event_type);
  const data = event.data || {};

  const renderBody = () => {
    switch (event.event_type) {
      // ── Stage lifecycle ──
      case 'stage_started':
      case 'pipeline_stage_started':
        return (
          <div className="event-card__banner event-card__banner--info">
            <StatusIcon type={event.event_type} />
            <span>Stage <strong>{event.stage}</strong> started</span>
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

      // ── Clarify ──
      case 'clarify_request':
        return (
          <div className="event-card__banner event-card__banner--warning">
            <svg className="event-card__icon event-card__icon--warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Awaiting confirmation before proceeding</span>
          </div>
        );

      // ── Chunk planned ──
      case 'chunk_planned':
        return (
          <div className="event-card__collapsible" onClick={() => setExpanded(!expanded)}>
            <div className="event-card__collapsible-header">
              <svg className={`event-card__chevron ${expanded ? 'event-card__chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="event-card__collapsible-title">
                Chunk #{data.index != null ? String(Number(data.index) + 1) : '?'}
                {has(data.preview) && <span className="event-card__preview">{truncate(str(data.preview), 80)}</span>}
              </span>
            </div>
            {expanded && has(data.content) && (
              <pre className="event-card__code">{str(data.content)}</pre>
            )}
          </div>
        );

      // ── Term extracted ──
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

      // ── Chunk translated ──
      case 'chunk_translated':
        return (
          <div className="event-card__chunk-pair">
            <div className="event-card__chunk-source">
              <span className="event-card__chunk-label">Source</span>
              <div className="event-card__chunk-text">{str(data.source)}</div>
            </div>
            <div className="event-card__chunk-target">
              <span className="event-card__chunk-label">Translation</span>
              <div className="event-card__chunk-text">{str(data.translated)}</div>
            </div>
          </div>
        );

      // ── Tool calls ──
      case 'tool_call_start':
      case 'tool_call_result':
        return (
          <div className="event-card__collapsible" onClick={() => setExpanded(!expanded)}>
            <div className="event-card__collapsible-header">
              <svg className={`event-card__chevron ${expanded ? 'event-card__chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="event-card__collapsible-title">
                <span className="event-card__tool-badge">
                  {event.event_type === 'tool_call_start' ? 'Tool Call' : 'Tool Result'}
                </span>
                {has(data.tool_name) && <code>{str(data.tool_name)}</code>}
              </span>
            </div>
            {expanded && (
              <pre className="event-card__code">
                {JSON.stringify(data.params || data.result || data, null, 2)}
              </pre>
            )}
          </div>
        );

      // ── LLM thinking ──
      case 'llm_thinking':
        return (
          <div className="event-card__collapsible" onClick={() => setExpanded(!expanded)}>
            <div className="event-card__collapsible-header">
              <svg className={`event-card__chevron ${expanded ? 'event-card__chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="event-card__collapsible-title">
                <span className="event-card__tool-badge event-card__tool-badge--thinking">Thinking</span>
                {has(data.preview) && <span className="event-card__preview">{truncate(str(data.preview), 60)}</span>}
              </span>
            </div>
            {expanded && has(data.content) && (
              <div className="event-card__thinking-content">{str(data.content)}</div>
            )}
          </div>
        );

      // ── Artifact created ──
      case 'artifact_created':
        return (
          <div className="event-card__artifact">
            <svg className="event-card__icon event-card__icon--success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div>
              <span className="event-card__artifact-title">{str(data.title || 'Artifact')}</span>
              {has(data.format) && (
                <span className="event-card__artifact-format">{str(data.format).toUpperCase()}</span>
              )}
            </div>
          </div>
        );

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
              <svg className={`event-card__chevron ${expanded ? 'event-card__chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
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
