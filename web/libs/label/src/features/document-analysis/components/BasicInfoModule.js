import React from 'react';
import { Card, Form, Input, DatePicker, TimePicker, Select, Row, Col } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const BasicInfoModule = ({ data, eventDescription, labHieStru, onChange, eventIndex }) => {
  // Helper to safely get array from labHieStru
  const getOptions = (path) => {
    try {
      return path.reduce((acc, key) => acc[key], labHieStru) || [];
    } catch (e) {
      return [];
    }
  };

  const aircraftOptions = getOptions(['基本信息', '机型']);
  const airportOptions = getOptions(['基本信息', '机场']);

  const aircraftValue = Array.isArray(data.机型)
    ? data.机型
    : (data.机型 ? [data.机型] : []);

  const handleFieldChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="basic-info-container">
      {/* 事件描述卡片 */}
      <Card
        title="事件描述"
        className="basic-info-card small-module-card"
        size="small"
        style={{ marginBottom: 8 }}
        extra={
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px', padding: '0 8px', fontSize: '14px', lineHeight: '22px' }}>
              Event_{String(eventIndex).padStart(2, '0')}
            </div>
            <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px', padding: '0 8px', fontSize: '14px', lineHeight: '22px' }}>
              {data.报告单位 || '未知单位'}
            </div>
          </div>
        }
      >
        <TextArea
          value={eventDescription}
          onChange={(e) => handleFieldChange('事件描述', e.target.value)}
          placeholder="事件详细描述..."
          rows={8}
          style={{ resize: 'vertical' }}
        />
      </Card>

      <Card
        title="基本信息"
        className="basic-info-card small-module-card"
        size="small"
      >
        <Form layout="vertical" size="small">
          <Row gutter={8}>
            <Col span={8}>
              <Form.Item label="日期">
                <DatePicker
                  style={{ width: '100%' }}
                  value={data.日期 ? dayjs(data.日期) : null}
                  onChange={(date, dateString) => handleFieldChange('日期', dateString)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="时间">
                <TimePicker
                  style={{ width: '100%' }}
                  value={data.时间 ? dayjs(data.时间, 'HH:mm:ss') : null}
                  format="HH:mm:ss"
                  onChange={(time, timeString) => handleFieldChange('时间', timeString)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="机型">
                <Select
                  mode="multiple"
                  value={aircraftValue}
                  onChange={(value) => handleFieldChange('机型', value)}
                  placeholder="选择机型"
                >
                  {aircraftOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            <Col span={8}>
              <Form.Item label="起飞机场">
                <Select
                  value={data.起飞机场}
                  onChange={(value) => handleFieldChange('起飞机场', value)}
                  showSearch
                  placeholder="起飞"
                >
                  {airportOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="落地机场">
                <Select
                  value={data.落地机场}
                  onChange={(value) => handleFieldChange('落地机场', value)}
                  showSearch
                  placeholder="落地"
                >
                  {airportOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="实际降落">
                <Select
                  value={data.实际降落机场}
                  onChange={(value) => handleFieldChange('实际降落机场', value)}
                  showSearch
                  placeholder="备降"
                >
                  {airportOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="备注">
            <TextArea
              value={data.备注}
              onChange={(e) => handleFieldChange('备注', e.target.value)}
              placeholder="请输入备注信息"
              rows={1}
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BasicInfoModule;
