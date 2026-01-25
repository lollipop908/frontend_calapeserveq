import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { GET_ALL_QUEUES_DEPARTMENT, GET_QUEUES_BY_DEPARTMENT } from '../../graphql/query';
import "./styles/Reports.css";

const Reports = ({ departments }) => {
  const [timeRange, setTimeRange] = useState('day');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
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

  return (
   <div className="reports">
  <h1 className='title'>DOWNLOAD REPORTS</h1>

  <div className="download-button">
    <button className="downloadbtn" onClick={downloadCSV} title="Download CSV">
      <FiDownload />
      <span>CSV</span>
    </button>
    <button className="downloadbtn" onClick={downloadPDF} title="Download Report">
      <FiFileText />
      <span>Report</span>
    </button>
  </div>
</div>

  );
};

export default Reports;