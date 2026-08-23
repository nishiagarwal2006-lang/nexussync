/**
 * NexusSync AI - Chart System
 * Data visualization using Canvas API
 */

class ChartSystem {
  constructor() {
    this.charts = new Map();
    this.initialize();
  }

  /**
   * Initialize chart system
   */
  initialize() {
    // Chart types
    this.chartTypes = {
      bar: this.renderBarChart.bind(this),
      line: this.renderLineChart.bind(this),
      donut: this.renderDonutChart.bind(this),
      scatter: this.renderScatterChart.bind(this)
    };
  }

  /**
   * Create a chart
   * @param {HTMLElement} container - Container element
   * @param {string} type - Chart type
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {string} Chart ID
   */
  createChart(container, type, data, options = {}) {
    if (!container || !this.chartTypes[type]) return null;
    
    const chartId = Utils.generateId('chart');
    const canvas = document.createElement('canvas');
    canvas.id = chartId;
    canvas.width = container.clientWidth || 400;
    canvas.height = options.height || 300;
    
    container.innerHTML = '';
    container.appendChild(canvas);
    
    const chart = {
      id: chartId,
      type,
      data,
      options,
      canvas,
      ctx: canvas.getContext('2d')
    };
    
    this.charts.set(chartId, chart);
    this.chartTypes[type](chart);
    
    return chartId;
  }

  /**
   * Render bar chart
   * @param {Object} chart - Chart object
   */
  renderBarChart(chart) {
    const { ctx, canvas, data } = chart;
    const { labels, values, colors } = data;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barWidth = chartWidth / values.length * 0.7;
    const barGap = chartWidth / values.length * 0.3;
    const maxValue = Math.max(...values, 1);
    
    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw bars
    labels.forEach((label, i) => {
      const x = padding + i * (barWidth + barGap);
      const barHeight = (values[i] / maxValue) * chartHeight;
      const y = canvas.height - padding - barHeight;
      
      // Bar
      ctx.fillStyle = colors?.[i] || '#38BDF8';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Bar value
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(values[i], x + barWidth / 2, y - 5);
      
      // Label
      ctx.fillText(label, x + barWidth / 2, canvas.height - padding + 20);
    });
  }

  /**
   * Render line chart
   * @param {Object} chart - Chart object
   */
  renderLineChart(chart) {
    const { ctx, canvas, data } = chart;
    const { labels, values, color = '#38BDF8' } = data;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;
    
    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw line
    ctx.beginPath();
    values.forEach((value, i) => {
      const x = padding + (i / (values.length - 1)) * chartWidth;
      const y = canvas.height - padding - ((value - minValue) / range) * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw points
    values.forEach((value, i) => {
      const x = padding + (i / (values.length - 1)) * chartWidth;
      const y = canvas.height - padding - ((value - minValue) / range) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Value label
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(value, x, y - 10);
    });
    
    // Labels
    if (labels) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      labels.forEach((label, i) => {
        const x = padding + (i / (labels.length - 1)) * chartWidth;
        ctx.fillText(label, x, canvas.height - padding + 20);
      });
    }
  }

  /**
   * Render donut chart
   * @param {Object} chart - Chart object
   */
  renderDonutChart(chart) {
    const { ctx, canvas, data } = chart;
    const { values, labels, colors } = data;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;
    const innerRadius = radius * 0.6;
    const total = values.reduce((sum, v) => sum + v, 0);
    
    let startAngle = -Math.PI / 2;
    
    values.forEach((value, i) => {
      const endAngle = startAngle + (value / total) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors?.[i] || '#38BDF8';
      ctx.fill();
      
      // Label
      const midAngle = (startAngle + endAngle) / 2;
      const labelX = centerX + Math.cos(midAngle) * (radius + innerRadius) / 2;
      const labelY = centerY + Math.sin(midAngle) * (radius + innerRadius) / 2;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round((value / total) * 100)}%`, labelX, labelY);
      
      startAngle = endAngle;
    });
    
    // Center text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total, centerX, centerY);
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('Total', centerX, centerY + 20);
  }

  /**
   * Render scatter chart
   * @param {Object} chart - Chart object
   */
  renderScatterChart(chart) {
    const { ctx, canvas, data } = chart;
    const { points, color = '#38BDF8' } = data;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxX = Math.max(...points.map(p => p.x), 1);
    const maxY = Math.max(...points.map(p => p.y), 1);
    
    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw points
    points.forEach(point => {
      const x = padding + (point.x / maxX) * chartWidth;
      const y = canvas.height - padding - (point.y / maxY) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = point.color || color;
      ctx.fill();
      
      if (point.label) {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, x, y - 10);
      }
    });
  }
}

// Initialize chart system
document.addEventListener('DOMContentLoaded', () => {
  window.chartSystem = new ChartSystem();
});