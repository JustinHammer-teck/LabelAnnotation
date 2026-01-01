import React from 'react';
import { Card, Tag, Typography, Space, Empty } from 'antd';

const { Title, Text } = Typography;

const TrainingTopicModule = ({ data }) => {
  const hasAnyTopics = () => {
    return (data.威胁相关 && data.威胁相关.length > 0) ||
           (data.差错相关 && data.差错相关.length > 0) ||
           (data.UAS相关 && data.UAS相关.length > 0);
  };

  const renderTopicSection = (title, topics, color) => {
    const list = Array.from(new Set(topics || []));

    return (
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: '13px' }}>
          {title}
        </Text>
        {list.length === 0 ? (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            自动带入
          </Text>
        ) : (
          <Space wrap>
            {list.map((topic, index) => (
              <Tag key={index} color={color} style={{ margin: '2px' }}>
                {topic}
              </Tag>
            ))}
          </Space>
        )}
      </div>
    );
  };

  return (
    <Card 
      title={<Title level={4} style={{ fontSize: '16px' }}>训练主题</Title>}
      className="module-card training-topic-module"
      size="small"
      style={{ height: '99%', minHeight: '400px', marginTop: 8 }}
    >
      {!hasAnyTopics() ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary" style={{ fontSize: '12px' }}>
              选择威胁/差错/UAS标签后<br/>自动生成训练主题
            </Text>
          }
        />
      ) : null}

      {renderTopicSection('威胁相关', data.威胁相关, 'orange')}
      {renderTopicSection('差错相关', data.差错相关, 'red')}
      {renderTopicSection('UAS相关', data.UAS相关, 'purple')}
    </Card>
  );
};

export default TrainingTopicModule;
