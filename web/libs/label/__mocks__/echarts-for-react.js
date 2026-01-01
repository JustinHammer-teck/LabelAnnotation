// Mock for echarts-for-react to avoid rendering issues in JSDOM
const React = require('react');

const MockECharts = React.forwardRef(function MockECharts(props, ref) {
  return React.createElement('div', {
    ref,
    'data-testid': 'echarts-mock',
    className: 'echarts-for-react',
    style: props.style,
  });
});

MockECharts.displayName = 'MockECharts';

module.exports = MockECharts;
module.exports.default = MockECharts;
