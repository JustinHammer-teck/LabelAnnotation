import React, { useEffect } from 'react';
import { Card, Select, Row, Col, Form, Input, TreeSelect } from 'antd';

import effectAndManage from '../../../data/effectAndManage.json';

const { Option } = Select;

const UASModule = ({ data, labHieStru, onChange, onLeafTagSelect, isHorizontal, isUASRequired = true }) => {
  const formData = Array.isArray(data) ? (data[0] || {}) : (data || {});

  useEffect(() => {
    if (Array.isArray(data) || !data) {
      onChange({
        level1: '',
        level2: '',
        level3: '',
        管理: '',
        应对能力: [],
        描述: ''
      });
    }
  }, [data, onChange]);

  const isDisabled = !isUASRequired;

  const handleUpdate = (field, value) => {
    const updatedItem = { ...formData, [field]: value };

    if (field === 'level1') {
      updatedItem.level2 = '';
      updatedItem.level3 = '';
    } else if (field === 'level2') {
      updatedItem.level3 = '';
    }

    if (field === 'level3') {
      onLeafTagSelect && onLeafTagSelect(value);
    }

    if (field === '应对能力') {
      updatedItem.应对能力 = Array.isArray(value) ? value : (value ? [value] : []);
    }

    onChange(updatedItem);
  };

  const getLevel1Options = () => Object.keys(labHieStru.UAS识别?.UAS类型 || {});
  const getLevel2Options = (l1) => l1 ? Object.keys(labHieStru.UAS识别?.UAS类型?.[l1] || {}) : [];
  const getLevel3Options = (l1, l2) => (l1 && l2) ? (labHieStru.UAS识别?.UAS类型?.[l1]?.[l2] || []) : [];

  const getManageOptions = () => effectAndManage?.UAS识别?.UAS管理 || [];

  const buildAbilityTreeData = () => {
    const abilities = labHieStru.UAS识别?.差错应对能力 || {};
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
    <Card title="UAS识别" size="small" className="module-card uas-module">
      <Form layout="vertical">
        {isDisabled && (
          <Form.Item>
            <div style={{ color: '#999' }}>根据相关性，当前不需要填写UAS识别</div>
          </Form.Item>
        )}
        <Form.Item label="UAS类型">
          <Row gutter={8}>
            <Col span={8}>
              <Select
                value={formData.level1}
                onChange={v => handleUpdate('level1', v)}
                placeholder="一级"
                style={{ width: '100%' }}
                disabled={isDisabled}
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
                disabled={isDisabled || !formData.level1}
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
                disabled={isDisabled || !formData.level2}
              >
                {getLevel3Options(formData.level1, formData.level2).map(o => <Option key={o} value={o}>{o}</Option>)}
              </Select>
            </Col>
          </Row>
        </Form.Item>

        <Row gutter={8}>
          <Col span={12}>
            <Form.Item label="管理">
              <Select
                value={formData.管理}
                onChange={v => handleUpdate('管理', v)}
                placeholder="选择管理"
                disabled={isDisabled}
              >
                {getManageOptions().map(o => <Option key={o} value={o}>{o}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="应对能力">
              <TreeSelect
                style={{ width: '100%' }}
                treeData={buildAbilityTreeData()}
                value={formData.应对能力}
                onChange={v => handleUpdate('应对能力', v)}
                treeCheckable
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                placeholder="选择应对能力"
                disabled={isDisabled}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="描述">
          <Input.TextArea
            value={formData.描述}
            onChange={e => handleUpdate('描述', e.target.value)}
            rows={1}
            placeholder="可补充该 UAS 事件的描述"
            disabled={isDisabled}
          />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UASModule;
