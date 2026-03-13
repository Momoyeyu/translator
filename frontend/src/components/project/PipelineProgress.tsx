import { Steps, Tag } from '@arco-design/web-react';
import type { PipelineTask } from '../../api/project';

const STAGE_ORDER = ['plan', 'clarify', 'translate', 'unify'];
const STAGE_LABELS: Record<string, string> = {
  plan: 'Plan',
  clarify: 'Clarify',
  translate: 'Translate',
  unify: 'Unify',
};

function getStepStatus(status: string): 'wait' | 'process' | 'finish' | 'error' {
  switch (status) {
    case 'completed':
      return 'finish';
    case 'running':
    case 'awaiting_input':
      return 'process';
    case 'failed':
      return 'error';
    default:
      return 'wait';
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
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Tag color="gray">{projectStatus === 'created' ? 'Not started' : projectStatus}</Tag>
      </div>
    );
  }

  const currentIndex = STAGE_ORDER.findIndex(
    (stage) => taskMap[stage]?.status === 'running' || taskMap[stage]?.status === 'awaiting_input'
  );

  return (
    <div style={{ padding: 24 }}>
      <Steps current={currentIndex >= 0 ? currentIndex + 1 : tasks.filter((t) => t.status === 'completed').length + 1}>
        {STAGE_ORDER.map((stage) => {
          const task = taskMap[stage];
          const status = task ? getStepStatus(task.status) : 'wait';
          let description = task?.status || 'pending';
          if (task?.status === 'awaiting_input') description = 'Waiting for confirmation';
          if (task?.error_message) description = task.error_message;

          return (
            <Steps.Step
              key={stage}
              title={STAGE_LABELS[stage]}
              description={description}
              status={status}
            />
          );
        })}
      </Steps>
    </div>
  );
}
