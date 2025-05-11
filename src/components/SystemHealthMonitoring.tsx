import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Badge, Spin, Alert, Typography } from 'antd';

const { Title } = Typography;

interface SystemHealthCheck {
  id: string;
  component: string;
  status: string;
  message: string;
  endpoint?: string;
  category?: string;
  created_at: string;
  last_checked: string;
}

const SystemHealthMonitoring: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<SystemHealthCheck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthChecks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/system-health-checks');
        setHealthChecks(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching system health checks:', err);
        setError('Failed to fetch system health checks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthChecks();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchHealthChecks, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ok':
        return <Badge status="success" text="OK" />;
      case 'warning':
        return <Badge status="warning" text="Warning" />;
      case 'error':
        return <Badge status="error" text="Error" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  const columns = [
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || 'System',
    },
    {
      title: 'Last Checked',
      dataIndex: 'last_checked',
      key: 'last_checked',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <Card>
      <Title level={4}>System Health Monitoring</Title>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      
      <Spin spinning={loading}>
        <Table
          dataSource={healthChecks}
          columns={columns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No health checks available' }}
        />
      </Spin>
    </Card>
  );
};

export default SystemHealthMonitoring;
