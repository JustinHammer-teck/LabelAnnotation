import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Upload,
  message,
  Row,
  Col,
  Space,
  Typography,
  Modal
} from 'antd';
import {
  UploadOutlined,
  LeftOutlined,
  RightOutlined,
  SaveOutlined,
  CheckOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import BasicInfoModule from './BasicInfoModule';
import ResultPerformanceList from './ResultPerformanceList';
import LabelingList from './LabelingList';

const { Title, Text } = Typography;

const DocumentAnalysis = ({ labHieStru, trainMap }) => {
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [currentEventData, setCurrentEventData] = useState({
    基本信息: {},
    结果绩效列表: [],
    标签标注列表: [],
    事件描述: ''
  });

  // 提取机型信息
  const extractAircraftType = useCallback((aircraftInfo) => {
    if (!aircraftInfo) return '';
    const aircraftTypes = labHieStru.基本信息.机型;
    for (const type of aircraftTypes) {
      if (aircraftInfo.includes(type)) {
        return type;
      }
    }
    return '';
  }, [labHieStru.基本信息.机型]);

  // Excel文件上传处理
  const handleFileUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.error('Excel文件为空或格式不正确');
          return;
        }

        // 解析Excel数据并转换为事件对象
        const parsedEvents = jsonData.map((row, index) => {
          const basicInfo = {
            事件编号: `EVENT_${String(index + 1).padStart(3, '0')}`,
            日期: row['事件发生时间'] || '',
            机型: extractAircraftType(row['涉及飞机（机型/注册号）'] || ''),
            起飞机场: row['起飞机场（四字代码）'] || '',
            落地机场: row['降落机场（四字代码）'] || '',
            实际降落机场: '',
            报告单位: row['报告单位'] || '未知单位',
            备注: ''
          };

          return {
            基本信息: basicInfo,
            事件描述: row['事件详情/处置结果／后续措施'] || '',
            结果绩效列表: [],
            标签标注列表: []
          };
        });

        setEvents(parsedEvents);
        setCurrentEventIndex(0);
        setCurrentEventData(parsedEvents[0]);
        message.success(`成功导入 ${parsedEvents.length} 条事件记录`);
      } catch (error) {
        console.error('Excel解析错误:', error);
        message.error('Excel文件解析失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // 阻止默认上传行为
  }, [extractAircraftType]);

  // 事件导航
  const navigateEvent = (direction) => {
    if (events.length === 0) return;

    let newIndex = currentEventIndex;
    if (direction === 'prev' && currentEventIndex > 0) {
      newIndex = currentEventIndex - 1;
    } else if (direction === 'next' && currentEventIndex < events.length - 1) {
      newIndex = currentEventIndex + 1;
    }

    if (newIndex !== currentEventIndex) {
      // 保存当前事件数据
      const updatedEvents = [...events];
      updatedEvents[currentEventIndex] = { ...currentEventData };
      setEvents(updatedEvents);

      // 切换到新事件
      setCurrentEventIndex(newIndex);
      setCurrentEventData(updatedEvents[newIndex]);
    }
  };

  // 保存当前标注
  const saveCurrentAnnotation = () => {
    if (events.length === 0) {
      message.warning('请先上传Excel文件');
      return;
    }

    const updatedEvents = [...events];
    updatedEvents[currentEventIndex] = { ...currentEventData };
    setEvents(updatedEvents);
    message.success('标注已保存到内存');
  };

  // 提交审核
  const submitForReview = () => {
    if (events.length === 0) {
      message.warning('请先上传Excel文件');
      return;
    }

    Modal.success({
      title: '提交成功',
      content: '当前事件标注已提交审核',
    });
  };

  // 更新当前事件数据
  const updateCurrentEventData = (field, value) => {
    setCurrentEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="annotation-content" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部操作区域 */}
      <Card className="content-header" style={{ marginBottom: 8, flexShrink: 0 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={handleFileUpload}
                showUploadList={false}
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  上传文档
                </Button>
              </Upload>

              {events.length > 0 && (
                <Space>
                  <Button
                    icon={<LeftOutlined />}
                    onClick={() => navigateEvent('prev')}
                    disabled={currentEventIndex === 0}
                  >
                    上一条
                  </Button>
                  <Text strong>
                    第 {currentEventIndex + 1} / {events.length} 条
                  </Text>
                  <Button
                    icon={<RightOutlined />}
                    onClick={() => navigateEvent('next')}
                    disabled={currentEventIndex === events.length - 1}
                  >
                    下一条
                  </Button>
                </Space>
              )}
            </Space>
          </Col>

          <Col>
            <Space>
              <Button
                type="default"
                icon={<SaveOutlined />}
                onClick={saveCurrentAnnotation}
                disabled={events.length === 0}
              >
                保存标注
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={submitForReview}
                disabled={events.length === 0}
              >
                提交审核
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {events.length === 0 ? (
        <Card style={{ flex: 1 }}>
          <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
            <Title level={4}>请上传Excel文件开始标注</Title>
            <Text>支持.xlsx格式文件</Text>
          </div>
        </Card>
      ) : (
        <Row gutter={16} style={{ flex: 1, overflow: 'hidden' }}>
          {/* 左侧区域 */}
          <Col span={10} style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ marginBottom: 4 }}>
              <BasicInfoModule
                data={currentEventData.基本信息}
                eventDescription={currentEventData.事件描述}
                labHieStru={labHieStru}
                eventIndex={currentEventIndex + 1}
                onChange={(field, value) => {
                  if (field === '事件描述') {
                    updateCurrentEventData('事件描述', value);
                  } else {
                    updateCurrentEventData('基本信息', {
                      ...currentEventData.基本信息,
                      [field]: value
                    });
                  }
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <ResultPerformanceList
                data={currentEventData.结果绩效列表}
                labHieStru={labHieStru}
                onChange={(value) => updateCurrentEventData('结果绩效列表', value)}
                labelingList={currentEventData.标签标注列表}
              />
            </div>
          </Col>

          {/* 右侧区域 */}
          <Col span={14} style={{ height: '100%', overflowY: 'auto' }}>
            <LabelingList
              data={currentEventData.标签标注列表}
              labHieStru={labHieStru}
              onChange={(value) => updateCurrentEventData('标签标注列表', value)}
              resultList={currentEventData.结果绩效列表}
              trainMap={trainMap}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DocumentAnalysis;
