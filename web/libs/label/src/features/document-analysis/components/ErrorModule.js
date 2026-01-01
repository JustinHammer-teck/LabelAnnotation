import React, { useEffect } from 'react';
import { Card, Select, Row, Col, Form, Input, TreeSelect } from 'antd';

import effectAndManage from '../../../data/effectAndManage.json';

const { Option } = Select;

const ErrorModule = ({ data, labHieStru, onChange, onLeafTagSelect, isHorizontal }) => {
  const formData = Array.isArray(data) ? (data[0] || {}) : (data || {});

  useEffect(() => {
    if (Array.isArray(data) || !data) {
      onChange({
        level1: '',
        level2: '',
        level3: '',
        管理: '',
        影响: '',
        应对能力: [],
        描述: ''
      });
    }
  }, [data, onChange]);

  const handleUpdate = (field, value) => {
    const updatedItem = { ...formData, [field]: value };

    if (field === 'level1') {
      updatedItem.level2 = '';
      updatedItem.level3 = '';
    } else if (field === 'level2') {
      updatedItem.level3 = '';
    }

    if (field === '管理') {
      const impacts = (effectAndManage?.差错识别?.差错管理?.[value]?.差错影响) || [];
      updatedItem.影响 = impacts.length === 1 ? impacts[0] : '';
    }

    if (field === '应对能力') {
      updatedItem.应对能力 = Array.isArray(value) ? value : (value ? [value] : []);
    }

    if (field === 'level3') {
      onLeafTagSelect && onLeafTagSelect(value);
    }

    onChange(updatedItem);
  };

  const getLevel1Options = () => Object.keys(labHieStru.差错识别?.差错类型 || {});
  const getLevel2Options = (l1) => l1 ? Object.keys(labHieStru.差错识别?.差错类型?.[l1] || {}) : [];
  const getLevel3Options = (l1, l2) => (l1 && l2) ? (labHieStru.差错识别?.差错类型?.[l1]?.[l2] || []) : [];

  const getManageOptions = () => Object.keys(effectAndManage?.差错识别?.差错管理 || {});
  const getImpactOptions = (manage) => {
    if (!manage) return [];
    const manageConfig = effectAndManage?.差错识别?.差错管理?.[manage] || {};
    return manageConfig.差错影响 || [];
  };

  const buildAbilityTreeData = () => {
    const abilities = labHieStru.差错识别?.差错应对能力 || {};
    return Object.entries(abilities).map(([group, items]) => ({
      title: group,
      value: group,
      selectable: false,
      disableCheckbox: true,
      children: items.map(item => ({
        title: item,
        value: item
      }))
    }));
  };

  return (
    <Card title="差错识别" size="small" className="module-card error-module">
      <Form layout="vertical">
        <Form.Item label="差错类型">
          <Row gutter={8}>
            <Col span={8}>
              <Select
                value={formData.level1}
                onChange={v => handleUpdate('level1', v)}
                placeholder="一级"
                style={{ width: '100%' }}
              >
                {getLevel1Options().map(o => <Option key={o} value={o}>{o}</Option>)}
              </Select>
            </Col>
            <Col span={8}>
              <Select
                value={formData.level2}
                onChange={v => handleUpdate('level2', v)}
                placeholder="二级"
                style={{ width: '100%' }}
                disabled={!formData.level1}
              >
                {getLevel2Options(formData.level1).map(o => <Option key={o} value={o}>{o}</Option>)}
              </Select>
            </Col>
            <Col span={8}>
              <Select
                value={formData.level3}
                onChange={v => handleUpdate('level3', v)}
                placeholder="三级"
                style={{ width: '100%' }}
                disabled={!formData.level2}
              >
                {getLevel3Options(formData.level1, formData.level2).map(o => <Option key={o} value={o}>{o}</Option>)}
              </Select>
            </Col>
          </Row>
        </Form.Item>

        <Row gutter={8}>
          <Col span={8}>
            <Form.Item label="管理">
              <Select
                value={formData.管理}
                onChange={v => handleUpdate('管理', v)}
                placeholder="选择管理"
              >
                {getManageOptions().map(o => <Option key={o} value={o}>{o}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="影响">
              <Select
                value={formData.影响}
                onChange={v => handleUpdate('影响', v)}
                placeholder="选择影响"
              >
                {getImpactOptions(formData.管理).map(o => <Option key={o} value={o}>{o}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="应对能力">
              <TreeSelect
                style={{ width: '100%' }}
                treeData={buildAbilityTreeData()}
                value={formData.应对能力}
                onChange={v => handleUpdate('应对能力', v)}
                treeCheckable
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                placeholder="选择应对能力"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="描述">
          <Input.TextArea
            value={formData.描述}
            onChange={e => handleUpdate('描述', e.target.value)}
            rows={1}
            placeholder="可补充该差错的描述"
          />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ErrorModule;
