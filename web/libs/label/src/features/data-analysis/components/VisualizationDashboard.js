import React, { useMemo } from 'react';
import { Card, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';

const VisualizationDashboard = ({ filteredEvents }) => {

    // 1. Prepare Data for Sankey Diagram
    const sankeyOption = useMemo(() => {
        if (!filteredEvents || filteredEvents.length === 0) return null;

        const nodes = new Set();
        const links = {};

        // Helper to add link
        const addLink = (source, target) => {
            if (!source || !target) return;
            const key = `${source}|${target}`;
            links[key] = (links[key] || 0) + 1;
            nodes.add(source);
            nodes.add(target);
        };

        filteredEvents.forEach(event => {
            // Iterate through labeling list to find paths
            // Threat -> Error -> UAS -> EventType
            // Note: This is a simplified view. Real paths might be complex.
            // We will try to link:
            // Threat(L3) -> Error(L3)
            // Error(L3) -> UAS(L3)
            // UAS(L3) -> EventType (from Result List)

            // If a stage is missing, we might link directly, e.g., Threat -> UAS

            const resultList = event.结果绩效列表 || [];
            const labelList = event.标签标注列表 || [];

            labelList.forEach(label => {
                const threat = label.威胁列表?.level3 ? `[威胁] ${label.威胁列表.level3}` : null;
                const error = label.差错列表?.level3 ? `[差错] ${label.差错列表.level3}` : null;
                const uas = label.UAS列表?.level3 ? `[UAS] ${label.UAS列表.level3}` : null;

                // Find associated result event type
                const res = resultList.find(r => r.id === label.关联事件类型ID);
                const eventType = res?.事件类型 ? `[事件] ${res.事件类型}` : null;

                // Construct path
                // T -> E
                if (threat && error) addLink(threat, error);
                // E -> U
                if (error && uas) addLink(error, uas);
                // U -> Event
                if (uas && eventType) addLink(uas, eventType);

                // Fallbacks for missing intermediate steps (optional, to keep flow connected)
                // T -> U (if no E)
                if (threat && !error && uas) addLink(threat, uas);
                // T -> Event (if no E, no U)
                if (threat && !error && !uas && eventType) addLink(threat, eventType);
                // E -> Event (if no U)
                if (error && !uas && eventType) addLink(error, eventType);
            });
        });

        const sankeyNodes = Array.from(nodes).map(name => ({ name }));
        const sankeyLinks = Object.entries(links).map(([key, value]) => {
            const [source, target] = key.split('|');
            return { source, target, value };
        });

        if (sankeyNodes.length === 0) return null;

        return {
            title: { text: '风险演化路径 (威胁 -> 差错 -> UAS -> 事件)', left: 'center', top: 0, textStyle: { fontSize: 14 } },
            tooltip: { trigger: 'item', triggerOn: 'mousemove' },
            series: [
                {
                    type: 'sankey',
                    top: 40,
                    left: '5%',
                    right: '15%',
                    data: sankeyNodes,
                    links: sankeyLinks,
                    emphasis: { focus: 'adjacency' },
                    lineStyle: { color: 'gradient', curveness: 0.5 },
                    label: { position: 'right' }
                }
            ]
        };
    }, [filteredEvents]);

    if (!filteredEvents || filteredEvents.length === 0) {
        return <Empty description="暂无数据，请调整筛选条件" />;
    }

    return (
        <div style={{ marginBottom: 16 }}>
            <Card size="small">
                {sankeyOption ? (
                    <ReactECharts option={sankeyOption} style={{ height: '400px' }} />
                ) : <Empty />}
            </Card>
        </div>
    );
};

export default VisualizationDashboard;
