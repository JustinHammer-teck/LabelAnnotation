import React from 'react';
import { Card, Button, Collapse, Form, Select, Input, Row, Col, Typography, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const ResultPerformanceList = ({ data, labHieStru, onChange, labelingList }) => {
    // Helper to get options
    const getOptions = (path) => {
        try {
            return path.reduce((acc, key) => acc[key], labHieStru) || [];
        } catch (e) {
            return [];
        }
    };

    const eventTypeOptions = getOptions(['基本信息', '事件标签']);
    const flightPhaseOptions = getOptions(['基本信息', '飞行阶段']);
    const possibilityOptions = getOptions(['结果模块', '训练评估', '可能性']);
    const severityOptions = getOptions(['结果模块', '训练评估', '严重程度']);
    const effectOptions = getOptions(['结果模块', '训练评估', '训练效果']);
    const trainingTopicOptions = getOptions(['结果绩效的训练主题']);

    const displayData = [...data].reverse();

    const handleAdd = () => {
        const newItem = {
            id: uuidv4(),
            事件类型: '',
            飞行阶段: '',
            可能性: '',
            严重程度: '',
            训练效果: '',
            训练方案设想: '',
            训练主题: [],
            所需达到的目标: ''
        };
        onChange([...data, newItem]);
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        onChange(data.filter(item => item.id !== id));
    };

    const handleItemChange = (id, field, value) => {
        const newData = data.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        });
        onChange(newData);
    };

    // Calculate summaries based on linked labeling items
    const getSummary = (resultId, type) => {
        if (!labelingList) return '';

        const linkedItems = labelingList.filter(item => item.关联事件类型ID === resultId);
        if (linkedItems.length === 0) return '';

        let allTags = [];
        linkedItems.forEach(item => {
            let record = {};
            if (type === 'threat') record = item.威胁列表 || {};
            if (type === 'error') record = item.差错列表 || {};

            // 以前这里还支持 UAS 标签的文本汇总，现在只用于威胁/差错

            const tag = record.level3 || record.level2 || record.level1;
            if (tag) allTags.push(tag);
        });

        return [...new Set(allTags)].join('; ');
    };

    // Calculate competency summary (KNO.1 / PRO.1 等应对能力) from linked labeling items
    const getCompetencySummary = (resultId) => {
        if (!labelingList) return '';

        const linkedItems = labelingList.filter(item => item.关联事件类型ID === resultId);
        if (linkedItems.length === 0) return '';

        let allAbilities = [];

        linkedItems.forEach(item => {
            const threat = item.威胁列表 || {};
            const error = item.差错列表 || {};
            const uas = item.UAS列表 || {};

            const threatAbilities = Array.isArray(threat.应对能力) ? threat.应对能力 : [];
            const errorAbilities = Array.isArray(error.应对能力) ? error.应对能力 : [];
            const uasAbilities = Array.isArray(uas.应对能力) ? uas.应对能力 : [];

            allAbilities = allAbilities
                .concat(threatAbilities)
                .concat(errorAbilities)
                .concat(uasAbilities);
        });

        const cleaned = allAbilities.filter(Boolean);
        return Array.from(new Set(cleaned)).join('; ');
    };

    const truncateText = (text, maxLength = 10) => {
        if (!text) return '';
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    };

    return (
        <Card
            title="结果绩效模块"
            size="small"
            className="small-module-card result-module"
            extra={
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
                    添加结果
                </Button>
                }
            style={{ marginTop: 0, height: '100%' }}
        >
            {data.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    暂无结果绩效，请点击右上角添加
                </div>
            ) : (
                <Collapse defaultActiveKey={displayData.map(item => item.id)}>
                    {displayData.map((item, index) => {
                        const threatSummary = getSummary(item.id, 'threat');
                        const errorSummary = getSummary(item.id, 'error');
                        const competencySummary = getCompetencySummary(item.id);

                        return (
                        <Panel
                            header={`结果绩效 ${data.length - index} - ${item.事件类型 || '未选择类型'}`}
                            key={item.id}
                            extra={
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => handleDelete(item.id, e)}
                                />
                            }
                        >
                            <Form layout="vertical" size="small">
                                <Row gutter={8}>
                                    <Col span={12}>
                                        <Form.Item label="事件类型">
                                            <Select
                                                value={item.事件类型}
                                                onChange={(val) => handleItemChange(item.id, '事件类型', val)}
                                                placeholder="选择事件类型"
                                            >
                                                {eventTypeOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="飞行阶段">
                                            <Select
                                                value={item.飞行阶段}
                                                onChange={(val) => handleItemChange(item.id, '飞行阶段', val)}
                                                placeholder="选择飞行阶段"
                                            >
                                                {flightPhaseOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={8}>
                                    <Col span={8}>
                                        <Form.Item label="可能性">
                                            <Select
                                                value={item.可能性}
                                                onChange={(val) => handleItemChange(item.id, '可能性', val)}
                                            >
                                                {possibilityOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item label="严重程度">
                                            <Select
                                                value={item.严重程度}
                                                onChange={(val) => handleItemChange(item.id, '严重程度', val)}
                                            >
                                                {severityOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item label="训练效果">
                                            <Select
                                                value={item.训练效果}
                                                onChange={(val) => handleItemChange(item.id, '训练效果', val)}
                                            >
                                                {effectOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item label="训练方案设想">
                                    <TextArea
                                        placeholder="输入设想训练方案"
                                        rows={1}
                                        value={item.训练方案设想}
                                        onChange={(e) => handleItemChange(item.id, '训练方案设想', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item label="训练主题">
                                    <Select
                                        mode="multiple"
                                        value={item.训练主题}
                                        onChange={(val) => handleItemChange(item.id, '训练主题', val)}
                                        placeholder="选择训练主题"
                                    >
                                        {trainingTopicOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                                    </Select>
                                </Form.Item>

                                <Form.Item label="所需达到的目标">
                                    <TextArea
                                        placeholder="输入所需达到的目标"
                                        rows={1}
                                        value={item.所需达到的目标}
                                        onChange={(e) => handleItemChange(item.id, '所需达到的目标', e.target.value)}
                                    />
                                </Form.Item>

                                <div style={{ background: '#f0f4f8', padding: '8px', borderRadius: '4px', border: '1px solid #e0e8f0' }}>
                                    <Text strong>自动汇总区域</Text>
                                    <Row gutter={8} style={{ marginTop: 4 }}>
                                        <Col span={8}>
                                            <Form.Item label="威胁汇总">
                                                <Tooltip title={threatSummary} placement="topLeft">
                                                    <TextArea
                                                        rows={2}
                                                        value={truncateText(threatSummary, 10)}
                                                        readOnly
                                                        style={{ background: '#fff' }}
                                                    />
                                                </Tooltip>
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="差错汇总">
                                                <Tooltip title={errorSummary} placement="topLeft">
                                                    <TextArea
                                                        rows={2}
                                                        value={truncateText(errorSummary, 10)}
                                                        readOnly
                                                        style={{ background: '#fff' }}
                                                    />
                                                </Tooltip>
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="胜任力汇总">
                                                <Tooltip title={competencySummary} placement="topLeft">
                                                    <TextArea
                                                        rows={2}
                                                        value={truncateText(competencySummary, 10)}
                                                        readOnly
                                                        style={{ background: '#fff' }}
                                                    />
                                                </Tooltip>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>

                            </Form>
                        </Panel>
                    )})}
                </Collapse>
            )}
        </Card>
    );
};

export default ResultPerformanceList;
