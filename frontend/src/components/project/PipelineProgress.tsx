import type { PipelineTask } from '../../api/project';
import './PipelineProgress.less';

const STAGE_ORDER = ['plan', 'clarify', 'translate', 'unify'];
const STAGE_LABELS: Record<string, string> = {
  plan: 'Plan',
  clarify: 'Clarify',
  translate: 'Translate',
  unify: 'Unify',
};

function getStepState(status: string): 'completed' | 'awaiting' | 'running' | 'failed' | 'pending' {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'awaiting_input':
      return 'awaiting';
    case 'running':
      return 'running';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'awaiting_input': return 'Awaiting confirmation';
    case 'running': return 'Running';
    case 'failed': return 'Failed';
    default: return 'Pending';
  }
}

interface Props {
  tasks: PipelineTask[];
  projectStatus: string;
}

export default function PipelineProgress({ tasks, projectStatus }: Props) {
  const taskMap = Object.fromEntries(tasks.map((t) => [t.stage, t]));

  if (tasks.length === 0) {
    return (
      <div className="pipeline__empty">
        <span className="pipeline__empty-badge">
          {projectStatus === 'created' ? 'Not started' : projectStatus}
        </span>
      </div>
    );
  }

  return (
    <div className="pipeline__stepper">
      {STAGE_ORDER.map((stage) => {
        const task = taskMap[stage];
        const state = task ? getStepState(task.status) : 'pending';
        const statusLabel = task ? getStatusLabel(task.status) : 'Pending';
        let description = '';
        if (task?.error_message) {
          description = task.error_message;
        } else if (state === 'completed' && task?.result) {
          // Show summary if available
          const result = task.result as Record<string, unknown>;
          if (result.summary && typeof result.summary === 'string') {
            description = result.summary;
          }
        } else if (state === 'awaiting') {
          description = 'Awaiting your confirmation before proceeding.';
        }

        return (
          <div
            key={stage}
            className={`pipeline__step pipeline__step--${state}`}
          >
            <div className={`pipeline__step-circle pipeline__step-circle--${state}`}>
              {state === 'completed' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {state === 'failed' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              {(state === 'awaiting' || state === 'running') && (
                <span className="pipeline__step-dot" />
              )}
            </div>
            <div className="pipeline__step-content">
              <div className="pipeline__step-header">
                <span className="pipeline__step-title">{STAGE_LABELS[stage]}</span>
                <span className={`pipeline__step-status pipeline__step-status--${state}`}>
                  {statusLabel}
                </span>
              </div>
              {description && (
                <div className="pipeline__step-description">{description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
