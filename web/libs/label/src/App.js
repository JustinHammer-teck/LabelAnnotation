import React, { useState } from 'react';
import { Layout, Menu, message } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  TagOutlined,
  SettingOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import DocumentAnalysis from './features/document-analysis/components/DocumentAnalysis';
import { DataAnalysis } from './features/data-analysis';
import labHieStru from './data/labHieStru.json';
import trainMap from './data/trainMap.json';

const { Header, Sider, Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('3');

  const menuItems = [
    {
      key: '1',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '2',
      icon: <FileTextOutlined />,
      label: '文档管理',
    },
    {
      key: '3',
      icon: <FileSearchOutlined />,
      label: '文档分析管理',
    },
    {
      key: '4',
      icon: <ProfileOutlined />,
      label: '任务管理',
    },
    {
      key: '5',
      icon: <BarChartOutlined />,
      label: '数据分析及可视化展示',
    },
    {
      key: '6',
      icon: <TagOutlined />,
      label: '标签管理',
    },
    {
      key: '7',
      icon: <SettingOutlined />,
      label: '系统管理',
    },
  ];

  const handleMenuClick = (e) => {
    // Allow key 3 and 5
    if (e.key !== '3' && e.key !== '5') {
      message.info('此功能仅为展示');
      return;
    }
    setSelectedKey(e.key);
  };

  const renderContent = () => {
    switch (selectedKey) {
      case '3':
        return <DocumentAnalysis labHieStru={labHieStru} trainMap={trainMap} />;
      case '5':
        return <DataAnalysis labHieStru={labHieStru} />;
      default:
        return (
          <div style={{ padding: '50px', textAlign: 'center', fontSize: '16px', color: '#999' }}>
            此页面仅为展示
          </div>
        );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div style={{
          height: '64px',
          background: 'linear-gradient(135deg, #1a5490 0%, #2d6aa8 100%)',
          // margin: '16px',
          borderRadius: '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          {collapsed ? 'DMS' : '✈ 文本证据分析系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          className="sidebar-menu"
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '2px solid #1a5490',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }}>
          
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a5490' }}>
            文档分析管理
          </span>
        </Header>
        <Content>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
