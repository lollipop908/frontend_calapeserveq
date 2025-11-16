import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { FiBarChart2, FiFilter, FiCalendar, FiTrendingUp, FiActivity, FiPieChart, FiDownload, FiFileText } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { GET_ALL_QUEUES_DEPARTMENT, GET_QUEUES_BY_DEPARTMENT } from '../../graphql/query';
import "./styles/ReportsPanel.css";

const ReportsPanel = ({ departments }) => {
  const [timeRange, setTimeRange] = useState('day');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartType, setChartType] = useState('area');
  const [chartData, setChartData] = useState([]);

  const { data: allQueuesData, loading: allLoading } = useQuery(GET_ALL_QUEUES_DEPARTMENT);
  const { data: deptQueuesData, loading: deptLoading } = useQuery(GET_QUEUES_BY_DEPARTMENT, {
    variables: { departmentId: parseInt(selectedDepartment) },
    skip: selectedDepartment === 'all'
  });

  const processQueueData = () => {
    const queues = selectedDepartment === 'all' 
      ? allQueuesData?.Queue || []
      : deptQueuesData?.QueueByDepartment || [];

    if (timeRange === 'day') {
      const dailyCounts = {};
      queues.forEach(queue => {
        const date = new Date(queue.createdAt).toLocaleDateString();
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });
      
      const sortedData = Object.entries(dailyCounts)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .slice(-7);
      
      setChartData(sortedData.map(([date, count]) => ({ 
        label: date, 
        value: count,
        name: date
      })));
    } else if (timeRange === 'month') {
      const monthlyCounts = {};
      queues.forEach(queue => {
        const date = new Date(queue.createdAt);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      });
      
      const sortedData = Object.entries(monthlyCounts)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .slice(-6);
      
      setChartData(sortedData.map(([month, count]) => ({ 
        label: month, 
        value: count,
        name: month
      })));
    } else if (timeRange === 'year') {
      const yearlyCounts = {};
      queues.forEach(queue => {
        const year = new Date(queue.createdAt).getFullYear();
        yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
      });
      
      const sortedData = Object.entries(yearlyCounts)
        .sort(([a], [b]) => a - b);
      
      setChartData(sortedData.map(([year, count]) => ({ 
        label: year, 
        value: count,
        name: year.toString()
      })));
    }
  };

  useEffect(() => {
    if (allQueuesData || deptQueuesData) {
      processQueueData();
    }
  }, [allQueuesData, deptQueuesData, timeRange, selectedDepartment]);

  const loading = allLoading || deptLoading;
  const totalQueues = chartData.reduce((sum, item) => sum + item.value, 0);
  const peakValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0;
  const avgValue = chartData.length > 0 ? Math.round(totalQueues / chartData.length) : 0;

  // Download functions
  const downloadCSV = () => {
    const headers = ['Period', 'Queue Count'];
    const rows = chartData.map(item => [item.label, item.value]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queue-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const downloadPDF = () => {
    const deptName = selectedDepartment === 'all' 
      ? 'All Departments' 
      : departments.find(d => d.departmentId === parseInt(selectedDepartment))?.departmentName;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; margin: 40px; }
          h1 { color: #5B8ED6; font-size: 18pt; margin-bottom: 10px; }
          h2 { color: #5B8ED6; font-size: 14pt; margin-top: 20px; margin-bottom: 10px; }
          .header { border-bottom: 2px solid #5B8ED6; padding-bottom: 10px; margin-bottom: 20px; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #5B8ED6; color: white; padding: 10px; text-align: left; font-weight: bold; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
          .footer { margin-top: 30px; font-size: 10pt; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Municipality of Calape - Queue Analytics Report</h1>
          <p style="color: #666; margin: 0;">Smart Queue Management System</p>
        </div>
        
        <div class="info">
          <p><span class="label">Generated:</span> ${new Date().toLocaleString()}</p>
          <p><span class="label">Time Range:</span> ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}</p>
          <p><span class="label">Department:</span> ${deptName}</p>
        </div>
        
        <h2>Summary Statistics</h2>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Total Queues</td>
            <td><strong>${totalQueues}</strong></td>
          </tr>
          <tr>
            <td>Peak Count</td>
            <td><strong>${peakValue}</strong></td>
          </tr>
          <tr>
            <td>Average per Period</td>
            <td><strong>${avgValue}</strong></td>
          </tr>
        </table>
        
        <h2>Detailed Data</h2>
        <table>
          <tr>
            <th>Period</th>
            <th>Queue Count</th>
          </tr>
          ${chartData.map(item => `
          <tr>
            <td>${item.label}</td>
            <td>${item.value}</td>
          </tr>
          `).join('')}
        </table>
        
        <div class="footer">
          <p>This report is automatically generated by the Municipality of Calape Queue Management System.</p>
          <p>© ${new Date().getFullYear()} Municipality of Calape. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Queue-Report-${timeRange}-${new Date().toISOString().split('T')[0]}.doc`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#5B8ED6', '#4A7BC1', '#8FBBEC', '#3A6AA8', '#72A8E0', '#2B5487', '#A1C9F0'];

  const renderChart = () => {
    if (loading) {
      return (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <span>Loading analytics data...</span>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="chart-empty">
          <FiBarChart2 className="empty-icon" />
          <p>No data available for the selected filters</p>
          <span>Try adjusting your filter criteria</span>
        </div>
      );
    }

    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B8ED6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#5B8ED6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#5B8ED6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#5B8ED6" strokeWidth={3} dot={{ fill: '#5B8ED6', r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="value" fill="#5B8ED6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="reports-panel">
      <div className="reports-header">
        <div className="reports-title-section">
          <div className="reports-title">
            <div className="title-icon-wrapper">
              <FiBarChart2 className="reports-icon" />
            </div>
            <div>
              <h2>Queue Analytics</h2>
              <p className="reports-subtitle">Real-time queue performance insights</p>
            </div>
          </div>
        </div>
        
        <div className="reports-filters">
          <div className="filter-group">
            <FiFilter className="filter-icon" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="filter-select"
            >
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          
          <div className="filter-group">
            <FiPieChart className="filter-icon" />
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          {timeRange === 'day' && (
            <div className="filter-group">
              <FiCalendar className="filter-icon" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>
          )}
        </div>
      </div>

      <div className="metrics-overview">
        <div className="metric-card metric-primary">
          <div className="metric-icon-wrapper total">
            <FiActivity />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Queues</div>
            <div className="metric-value">{totalQueues}</div>
            <div className="metric-change positive">+12.5% from last period</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon-wrapper peak">
            <FiTrendingUp />
          </div>
          <div className="metric-content">
            <div className="metric-label">Peak Count</div>
            <div className="metric-value">{peakValue}</div>
            <div className="metric-change neutral">Highest volume</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon-wrapper average">
            <FiBarChart2 />
          </div>
          <div className="metric-content">
            <div className="metric-label">Average</div>
            <div className="metric-value">{avgValue}</div>
            <div className="metric-change neutral">Per period</div>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h3>Queue Distribution</h3>
            <p className="chart-description">
              {timeRange === 'day' ? 'Last 7 days' : timeRange === 'month' ? 'Last 6 months' : 'All years'}
            </p>
          </div>
          <div className="chart-controls">
            <div className="chart-type-selector">
              <button 
                className={`chart-btn ${chartType === 'area' ? 'active' : ''}`}
                onClick={() => setChartType('area')}
                title="Area Chart"
              >
                Area
              </button>
              <button 
                className={`chart-btn ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
                title="Line Chart"
              >
                Line
              </button>
              <button 
                className={`chart-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
                title="Bar Chart"
              >
                Bar
              </button>
              <button 
                className={`chart-btn ${chartType === 'pie' ? 'active' : ''}`}
                onClick={() => setChartType('pie')}
                title="Pie Chart"
              >
                Pie
              </button>
            </div>
            <div className="download-buttons">
              <button className="download-btn" onClick={downloadCSV} title="Download CSV">
                <FiDownload />
                <span>CSV</span>
              </button>
              <button className="download-btn" onClick={downloadPDF} title="Download Report">
                <FiFileText />
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="chart-content">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;