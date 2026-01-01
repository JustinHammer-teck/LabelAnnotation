import React from 'react';
import { Card, Form, Select, DatePicker, Button, Row, Col, Space, Cascader } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * FilterPanel component for aviation event filtering.
 *
 * Supports two modes:
 * 1. Server-side: Uses filterOptions from API for dynamic options
 * 2. Client-side: Uses labHieStru for static options (legacy mode)
 *
 * @param {Object} props
 * @param {Object} [props.labHieStru] - Label hierarchy structure for static options
 * @param {Object} [props.filterOptions] - Dynamic filter options from API
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Function} [props.onReset] - Callback when filters are reset (server-side mode)
 * @param {number} props.totalCount - Total count of filtered events
 */
const FilterPanel = ({ labHieStru, filterOptions, onFilterChange, onReset, totalCount }) => {
    const [form] = Form.useForm();

    // Helper to get options from labHieStru (legacy mode)
    const getOptions = (path) => {
        try {
            return path.reduce((acc, key) => acc[key], labHieStru) || [];
        } catch (e) {
            return [];
        }
    };

    // Get options from either filterOptions (API) or labHieStru (static)
    const aircraftOptions = filterOptions?.aircraft || getOptions(['基本信息', '机型']);
    const airportOptions = filterOptions?.airports || getOptions(['基本信息', '机场']);
    const eventTypeOptions = filterOptions?.eventTypes || getOptions(['基本信息', '事件标签']);
    const flightPhaseOptions = filterOptions?.flightPhases || getOptions(['基本信息', '飞行阶段']);
    const trainingTopicOptions = filterOptions?.trainingTopics || getOptions(['结果绩效的训练主题']);

    // Build cascader options for threat/error/UAS types
    const buildCascaderOptions = (typeData) => {
        if (!typeData) return [];
        return Object.entries(typeData).map(([level1, level2Obj]) => ({
            value: level1,
            label: level1,
            children: Object.entries(level2Obj || {}).map(([level2, level3Arr]) => ({
                value: level2,
                label: level2,
                children: (level3Arr || []).map(level3 => ({
                    value: level3,
                    label: level3
                }))
            }))
        }));
    };

    const threatCascaderOptions = buildCascaderOptions(getOptions(['威胁识别', '威胁类型']));
    const errorCascaderOptions = buildCascaderOptions(getOptions(['差错识别', '差错类型']));
    const uasCascaderOptions = buildCascaderOptions(getOptions(['UAS识别', 'UAS类型']));

    // Build competency cascader options
    const buildCompetencyCascaderOptions = (data) => {
        if (!data) return [];
        return Object.entries(data).map(([category, items]) => ({
            value: category,
            label: category,
            children: (items || []).map(item => ({
                value: item,
                label: item
            }))
        }));
    };
    const competencyCascaderOptions = buildCompetencyCascaderOptions(getOptions(['胜任力模块']));

    const handleValuesChange = (changedValues, allValues) => {
        // Convert dateRange from dayjs objects to ISO strings for server-side filtering
        const processedValues = { ...allValues };
        if (allValues.dateRange && allValues.dateRange.length === 2) {
            processedValues.dateRange = [
                allValues.dateRange[0]?.format?.('YYYY-MM-DD') || allValues.dateRange[0],
                allValues.dateRange[1]?.format?.('YYYY-MM-DD') || allValues.dateRange[1],
            ];
        }
        onFilterChange(processedValues);
    };

    const handleReset = () => {
        form.resetFields();
        if (onReset) {
            // Server-side mode: call the reset callback
            onReset();
        } else {
            // Client-side mode: pass empty filters
            onFilterChange({});
        }
    };

    return (
        <Card
            title={
                <Space>
                    <span>筛选条件</span>
                    <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>
                        (共筛选出 {totalCount} 条事件)
                    </span>
                </Space>
            }
            size="small"
            style={{ marginBottom: 16 }}
            extra={
                <Button type="link" icon={<ReloadOutlined />} onClick={handleReset}>
                    重置筛选
                </Button>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
                size="small"
            >
                <Row gutter={16}>
                    <Col span={6}>
                        <Form.Item name="dateRange" label="时间范围">
                            <RangePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="aircraft" label="机型">
                            <Select mode="multiple" placeholder="全部" allowClear>
                                {aircraftOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="airport" label="机场 (起飞/落地/实际降落)">
                            <Select showSearch placeholder="全部" allowClear>
                                {airportOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="eventType" label="事件类型">
                            <Select mode="multiple" placeholder="全部" allowClear>
                                {eventTypeOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={6}>
                        <Form.Item name="flightPhase" label="飞行阶段">
                            <Select mode="multiple" placeholder="全部" allowClear>
                                {flightPhaseOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="threatType" label="涉及威胁类型">
                            <Cascader
                                options={threatCascaderOptions}
                                placeholder="全部"
                                changeOnSelect
                                allowClear
                                expandTrigger="hover"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="errorType" label="涉及差错类型">
                            <Cascader
                                options={errorCascaderOptions}
                                placeholder="全部"
                                changeOnSelect
                                allowClear
                                expandTrigger="hover"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="uasType" label="涉及UAS类型">
                            <Cascader
                                options={uasCascaderOptions}
                                placeholder="全部"
                                changeOnSelect
                                allowClear
                                expandTrigger="hover"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="trainingTopic" label="包含训练主题">
                            <Select mode="multiple" placeholder="全部" allowClear>
                                {trainingTopicOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="competency" label="涉及胜任力">
                            <Cascader
                                options={competencyCascaderOptions}
                                placeholder="全部"
                                multiple
                                changeOnSelect
                                allowClear
                                expandTrigger="hover"
                                maxTagCount="responsive"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default FilterPanel;
