import React, { useState } from 'react';
import { Card, Table, Button, Modal, Descriptions, Tag, Typography } from 'antd';
import { EyeOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Helper to safely extract displayable value from various data types
// Handles objects with {value} key, arrays, strings, and other types
const safeValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle objects like {value: "actual value"}
        if ('value' in value) return safeValue(value.value);
        // Empty object
        if (Object.keys(value).length === 0) return '-';
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return value.map(v => safeValue(v)).join(', ') || '-';
    }
    if (typeof value === 'string') return value || '-';
    return String(value);
};

/**
 * EventList component for displaying aviation events in a table.
 *
 * Supports two modes:
 * 1. Server-side pagination: Uses hasMore/loadMore/loading props for infinite scroll
 * 2. Client-side pagination: Uses standard table pagination (legacy mode)
 *
 * @param {Object} props
 * @param {Array} props.filteredEvents - Array of events to display
 * @param {boolean} [props.hasMore] - Whether more events can be loaded (server-side mode)
 * @param {Function} [props.loadMore] - Function to load more events (server-side mode)
 * @param {boolean} [props.loading] - Loading state for pagination (server-side mode)
 */
const EventList = ({ filteredEvents, hasMore, loadMore, loading }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(null);

    const showDetail = (record) => {
        setCurrentEvent(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setCurrentEvent(null);
    };

    const columns = [
        {
            title: '事件编号',
            dataIndex: 'eventId',
            key: 'eventId',
            width: 120,
        },
        {
            title: '日期',
            dataIndex: ['基本信息', '日期'],
            key: 'date',
            width: 120,
        },
        {
            title: '机型',
            dataIndex: ['基本信息', '机型'],
            key: 'aircraft',
            width: 100,
        },
        {
            title: '事件类型',
            key: 'eventType',
            render: (_, record) => {
                const types = (record.结果绩效列表 || []).map(r => r.事件类型).filter(Boolean);
                return types.join('; ');
            },
            width: 150,
        },
        {
            title: '涉及威胁',
            key: 'threat',
            render: (_, record) => {
                const threats = (record.标签标注列表 || [])
                    .map(l => l.威胁列表?.level3)
                    .filter(Boolean);
                return [...new Set(threats)].join('; ');
            },
            ellipsis: true,
        },
        {
            title: '涉及差错',
            key: 'error',
            render: (_, record) => {
                const errors = (record.标签标注列表 || [])
                    .map(l => l.差错列表?.level3)
                    .filter(Boolean);
                return [...new Set(errors)].join('; ');
            },
            ellipsis: true,
        },
        {
            title: '训练主题',
            key: 'topics',
            render: (_, record) => {
                const topics = (record.结果绩效列表 || []).flatMap(r => r.训练主题 || []);
                const uniqueTopics = [...new Set(topics)];
                return (
                    <>
                        {uniqueTopics.slice(0, 3).map(t => <Tag key={t}>{t}</Tag>)}
                        {uniqueTopics.length > 3 && <Tag>...</Tag>}
                    </>
                );
            },
            width: 200,
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
                    详情
                </Button>
            ),
        },
    ];

    // Determine if we're in server-side pagination mode
    const isServerSideMode = typeof loadMore === 'function';

    return (
        <Card title="事件列表" size="small">
            <Table
                dataSource={filteredEvents}
                columns={columns}
                rowKey={(record, index) => record.id || `${record.eventId}-${index}`}
                size="small"
                pagination={isServerSideMode ? false : { pageSize: 10 }}
            />

            {/* Load more button for server-side pagination */}
            {isServerSideMode && hasMore && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Button
                        onClick={loadMore}
                        loading={loading}
                        icon={loading ? <LoadingOutlined /> : null}
                    >
                        {loading ? '加载中...' : '加载更多'}
                    </Button>
                </div>
            )}

            <Modal
                title={`事件详情 - ${currentEvent?.eventId}`}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={800}
            >
                {currentEvent && (
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <Descriptions title="基本信息" bordered size="small" column={2}>
                            <Descriptions.Item label="事件编号">{safeValue(currentEvent.基本信息?.事件编号)}</Descriptions.Item>
                            <Descriptions.Item label="日期">{safeValue(currentEvent.基本信息?.日期)} {safeValue(currentEvent.基本信息?.时间)}</Descriptions.Item>
                            <Descriptions.Item label="机型">{safeValue(currentEvent.基本信息?.机型)}</Descriptions.Item>
                            <Descriptions.Item label="报告单位">{safeValue(currentEvent.基本信息?.报告单位)}</Descriptions.Item>
                            <Descriptions.Item label="起飞机场">{safeValue(currentEvent.基本信息?.起飞机场)}</Descriptions.Item>
                            <Descriptions.Item label="落地机场">{safeValue(currentEvent.基本信息?.落地机场)}</Descriptions.Item>
                            <Descriptions.Item label="实际降落">{safeValue(currentEvent.基本信息?.实际降落)}</Descriptions.Item>
                            <Descriptions.Item label="备注">{safeValue(currentEvent.基本信息?.备注)}</Descriptions.Item>
                        </Descriptions>

                        {currentEvent.事件描述 && (
                            <div style={{ marginTop: 16 }}>
                                <Text strong>事件描述：</Text>
                                <div style={{ marginTop: 8, padding: 8, background: '#f9f9f9', borderRadius: 4 }}>
                                    {safeValue(currentEvent.事件描述)}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 16 }}>
                            <Text strong>结果绩效列表：</Text>
                            {currentEvent.结果绩效列表?.map((res, idx) => (
                                <Card key={res.id || idx} size="small" style={{ marginTop: 8, background: '#f9f9f9' }}>
                                    <Descriptions size="small" column={2}>
                                        <Descriptions.Item label="事件类型">{safeValue(res.事件类型)}</Descriptions.Item>
                                        <Descriptions.Item label="飞行阶段">{safeValue(res.飞行阶段)}</Descriptions.Item>
                                        <Descriptions.Item label="可能性">{safeValue(res.可能性)}</Descriptions.Item>
                                        <Descriptions.Item label="严重程度">{safeValue(res.严重程度)}</Descriptions.Item>
                                        <Descriptions.Item label="训练效果">{safeValue(res.训练效果)}</Descriptions.Item>
                                        <Descriptions.Item label="训练主题" span={2}>
                                            {(Array.isArray(res.训练主题) ? res.训练主题 : []).map((t, i) => <Tag key={safeValue(t) + i}>{safeValue(t)}</Tag>)}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="训练方案设想" span={2}>{safeValue(res.训练方案设想)}</Descriptions.Item>
                                        <Descriptions.Item label="所需达到的目标" span={2}>{safeValue(res.所需达到的目标)}</Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            ))}
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <Text strong>标签标注列表：</Text>
                            {currentEvent.标签标注列表?.map((label, idx) => (
                                <Card key={label.id || idx} size="small" style={{ marginTop: 8, borderColor: '#d9d9d9' }}>
                                    <Descriptions size="small" column={1} bordered>
                                        <Descriptions.Item label="威胁">
                                            {label.威胁列表?.level1 ? (
                                                <div>
                                                    <div>{safeValue(label.威胁列表.level1)} &gt; {safeValue(label.威胁列表.level2)} &gt; {safeValue(label.威胁列表.level3)}</div>
                                                    <div><Text type="secondary">管理: {safeValue(label.威胁列表.管理)} | 影响: {safeValue(label.威胁列表.影响)} | 应对能力: {safeValue(label.威胁列表.应对能力)}</Text></div>
                                                    {label.威胁列表.描述 && <div><Text type="secondary">描述: {safeValue(label.威胁列表.描述)}</Text></div>}
                                                </div>
                                            ) : '无'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="差错">
                                            {label.差错列表?.level1 ? (
                                                <div>
                                                    <div>{safeValue(label.差错列表.level1)} &gt; {safeValue(label.差错列表.level2)} &gt; {safeValue(label.差错列表.level3)}</div>
                                                    <div><Text type="secondary">管理: {safeValue(label.差错列表.管理)} | 影响: {safeValue(label.差错列表.影响)} | 应对能力: {safeValue(label.差错列表.应对能力)}</Text></div>
                                                    {label.差错列表.描述 && <div><Text type="secondary">描述: {safeValue(label.差错列表.描述)}</Text></div>}
                                                </div>
                                            ) : '无'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="UAS">
                                            {label.UAS列表?.level1 ? (
                                                <div>
                                                    <div>{safeValue(label.UAS列表.level1)} &gt; {safeValue(label.UAS列表.level2)} &gt; {safeValue(label.UAS列表.level3)}</div>
                                                    <div><Text type="secondary">管理: {safeValue(label.UAS列表.管理)} | 应对能力: {safeValue(label.UAS列表.应对能力)}</Text></div>
                                                    {label.UAS列表.描述 && <div><Text type="secondary">描述: {safeValue(label.UAS列表.描述)}</Text></div>}
                                                </div>
                                            ) : '无'}
                                        </Descriptions.Item>
                                        {label.结束状态描述 && (
                                            <Descriptions.Item label="结束状态">{safeValue(label.结束状态描述)}</Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
};

export default EventList;
