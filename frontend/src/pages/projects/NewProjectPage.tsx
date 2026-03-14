import { Button, Card, Form, Input, Message, Select, Upload } from '@arco-design/web-react';
import { IconUpload } from '@arco-design/web-react/icon';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../../api/project';

const LANGUAGES = [
  { label: 'Chinese (zh)', value: 'zh' },
  { label: 'English (en)', value: 'en' },
  { label: 'Japanese (ja)', value: 'ja' },
  { label: 'Korean (ko)', value: 'ko' },
  { label: 'French (fr)', value: 'fr' },
  { label: 'German (de)', value: 'de' },
  { label: 'Spanish (es)', value: 'es' },
  { label: 'Russian (ru)', value: 'ru' },
  { label: 'Arabic (ar)', value: 'ar' },
  { label: 'Portuguese (pt)', value: 'pt' },
];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (values: Record<string, string | undefined>) => {
    if (!file) {
      Message.error('Please upload a document');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', values.title!);
      formData.append('target_language', values.target_language!);
      if (values.source_language) {
        formData.append('source_language', values.source_language);
      }
      formData.append('formality', values.formality ?? 'neutral');

      const res = await createProject(formData);
      Message.success('Project created');
      navigate(`/projects/${res.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      Message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Card title="New Translation Project">
        <Form layout="vertical" onSubmit={handleSubmit}>
          <Form.Item label="Title" field="title" rules={[{ required: true }]}>
            <Input placeholder="Project title" />
          </Form.Item>

          <Form.Item label="Document">
            <Upload
              accept=".txt,.md,.html,.pdf,.docx"
              limit={1}
              onChange={(_, currentFile) => {
                if (currentFile.originFile) {
                  setFile(currentFile.originFile);
                }
              }}
            >
              <Button icon={<IconUpload />}>Upload Document</Button>
            </Upload>
          </Form.Item>

          <Form.Item label="Target Language" field="target_language" rules={[{ required: true }]}>
            <Select options={LANGUAGES} placeholder="Select target language" />
          </Form.Item>

          <Form.Item label="Source Language (optional)" field="source_language">
            <Select options={LANGUAGES} placeholder="Auto-detect" allowClear />
          </Form.Item>

          <Form.Item label="Formality" field="formality" initialValue="neutral">
            <Select
              options={[
                { label: 'Neutral', value: 'neutral' },
                { label: 'Formal', value: 'formal' },
                { label: 'Informal', value: 'informal' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} long>
              Create & Start Translation
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
