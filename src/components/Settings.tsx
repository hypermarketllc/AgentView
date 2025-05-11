import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Input, Button, Spin, Alert, Typography, Divider } from 'antd';

const { Title } = Typography;

interface Setting {
  key: string;
  value: string;
  description?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/settings');
        setSettings(response.data);
        setError(null);
        
        // Set form values
        const formValues: Record<string, string> = {};
        response.data.forEach((setting: Setting) => {
          formValues[setting.key] = setting.value;
        });
        form.setFieldsValue(formValues);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to fetch settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      
      // Update each setting
      for (const key of Object.keys(values)) {
        const setting = settings.find(s => s.key === key);
        
        if (setting && setting.value !== values[key]) {
          await axios.put(`/api/settings/${key}`, {
            value: values[key],
            description: setting.description
          });
        }
      }
      
      // Refresh settings
      const response = await axios.get('/api/settings');
      setSettings(response.data);
      
      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  // Group settings by category
  const groupedSettings: Record<string, Setting[]> = {};
  settings.forEach(setting => {
    const category = setting.category || 'general';
    if (!groupedSettings[category]) {
      groupedSettings[category] = [];
    }
    groupedSettings[category].push(setting);
  });

  return (
    <Card>
      <Title level={4}>System Settings</Title>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {saveSuccess && <Alert message="Settings saved successfully" type="success" showIcon style={{ marginBottom: 16 }} />}
      
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          {Object.keys(groupedSettings).map(category => (
            <div key={category}>
              <Divider orientation="left">{category.charAt(0).toUpperCase() + category.slice(1)}</Divider>
              
              {groupedSettings[category].map(setting => (
                <Form.Item
                  key={setting.key}
                  name={setting.key}
                  label={setting.description || setting.key}
                  tooltip={`Key: ${setting.key}`}
                >
                  <Input />
                </Form.Item>
              ))}
            </div>
          ))}
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default Settings;
