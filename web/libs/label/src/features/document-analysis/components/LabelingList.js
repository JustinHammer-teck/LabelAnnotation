import React from 'react';
import { Card, Button, Collapse, Form, Select, Row, Col, Space, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import ThreatModule from './ThreatModule';
import ErrorModule from './ErrorModule';
import UASModule from './UASModule';
import TrainingTopicModule from './TrainingTopicModule';

const { Panel } = Collapse;
const { Option } = Select;

const LabelingList = ({ data, labHieStru, onChange, resultList, trainMap }) => {
    const displayData = [...data].reverse();

    const handleAdd = () => {
        const newItem = {
            id: uuidv4(),
            关联事件类型ID: '',
            威胁列表: {},
            差错列表: {},
            UAS列表: {},
            训练主题: {
                威胁相关: [],
                差错相关: [],
                UAS相关: []
            },
            结束状态描述: ''
        };
        onChange([...data, newItem]);
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        onChange(data.filter(item => item.id !== id));
    };

    const computeTrainingTopics = (item) => {
        const baseTopics = {
            威胁相关: [],
            差错相关: [],
            UAS相关: []
        };

        if (!trainMap || !trainMap.训练主题映射) {
            return baseTopics;
        }

        const mapping = trainMap.训练主题映射;

        const addTopics = (categoryKey, leafTag) => {
            if (!leafTag) return;
            const categoryMapping = mapping[categoryKey] || {};
            const topics = categoryMapping[leafTag] || [];
            if (!topics || topics.length === 0) return;
            baseTopics[categoryKey] = Array.from(new Set([...baseTopics[categoryKey], ...topics]));
        };

        addTopics('威胁相关', item.威胁列表 && item.威胁列表.level3);
        addTopics('差错相关', item.差错列表 && item.差错列表.level3);
        addTopics('UAS相关', item.UAS列表 && item.UAS列表.level3);

        return baseTopics;
    };

    const handleItemChange = (id, field, value) => {
        const newData = data.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                const newTrainingTopics = computeTrainingTopics(updatedItem);

                return {
                    ...updatedItem,
                    训练主题: newTrainingTopics
                };
            }
            return item;
        });
        onChange(newData);
    };

    return (
        <Card
            title="标签标注模块"
            size="small"
            className="small-module-card labeling-module"
            extra={
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
                    添加标注
                </Button>
            }
            style={{ height: '100%', overflow: 'auto' }}
        >
            {data.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    暂无标注，请点击右上角添加
                </div>
            ) : (
                <Collapse defaultActiveKey={displayData.map(item => item.id)}>
                    {displayData.map((item, index) => {
                        const linkedResult = resultList.find(r => r.id === item.关联事件类型ID);
                        const headerText = linkedResult
                            ? `标注 ${data.length - index} - 关联: ${linkedResult.事件类型 || '未命名'}`
                            : `标注 ${data.length - index} - 未关联`;

                        const typeParts = [];
                        if (item.威胁列表 && item.威胁列表.level3) {
                            typeParts.push(`威胁类型: ${item.威胁列表.level3}`);
                        }
                        if (item.差错列表 && item.差错列表.level3) {
                            typeParts.push(`差错类型: ${item.差错列表.level3}`);
                        }
                        if (item.UAS列表 && item.UAS列表.level3) {
                            typeParts.push(`UAS类型: ${item.UAS列表.level3}`);
                        }
                        const typeSummary = typeParts.join(' | ');

                        const isUASRequired = (item.威胁列表 && item.威胁列表.影响 === '导致UAS T') || (item.差错列表 && item.差错列表.影响 === '导致UAS E');

                        const headerNode = (
                            <div>
                                <div>{headerText}</div>
                                {typeSummary && (
                                    <div style={{ fontSize: 13, color: '#999' }}>{typeSummary}</div>
                                )}
                            </div>
                        );

                        return (
                            <Panel
                                header={headerNode}
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
                                    <Form.Item label="关联事件类型">
                                        <Select
                                            value={item.关联事件类型ID}
                                            onChange={(val) => handleItemChange(item.id, '关联事件类型ID', val)}
                                            placeholder="请选择关联的结果绩效"
                                        >
                                            {resultList.map(res => (
                                                <Option key={res.id} value={res.id}>
                                                    {res.事件类型 || '未命名类型'} - {res.飞行阶段 || '未选阶段'}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Row gutter={8}>
                                        <Col span={18}>
                                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                                <ThreatModule
                                                    data={item.威胁列表}
                                                    labHieStru={labHieStru}
                                                    onChange={(val) => handleItemChange(item.id, '威胁列表', val)}
                                                    isHorizontal={true}
                                                />
                                                <ErrorModule
                                                    data={item.差错列表}
                                                    labHieStru={labHieStru}
                                                    onChange={(val) => handleItemChange(item.id, '差错列表', val)}
                                                    isHorizontal={true}
                                                />
                                                <UASModule
                                                    data={item.UAS列表}
                                                    labHieStru={labHieStru}
                                                    onChange={(val) => handleItemChange(item.id, 'UAS列表', val)}
                                                    isHorizontal={true}
                                                    isUASRequired={isUASRequired}
                                                />
                                            </Space>
                                        </Col>
                                        <Col span={6}>
                                            <TrainingTopicModule
                                                data={item.训练主题}
                                            />
                                        </Col>
                                    </Row>

                                    <Form.Item style={{ marginTop: 8 }}>
                                        <Input.TextArea
                                            rows={1}
                                            value={item.结束状态描述}
                                            onChange={(e) => handleItemChange(item.id, '结束状态描述', e.target.value)}
                                            placeholder="可补充该事件结束状态的文字说明"
                                        />
                                    </Form.Item>
                                </Form>
                            </Panel>
                        );
                    })}
                </Collapse>
            )}
        </Card>
    );
};

export default LabelingList;
