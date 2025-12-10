import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartComponent } from '@re/core';

const COLORS = ['#0066ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export function Chart({ props }: { props: ChartComponent['props'] }) {
  const { chartType, data, xKey, yKey, title } = props;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--re-border)" />
            <XAxis dataKey={xKey} stroke="var(--re-text-secondary)" />
            <YAxis stroke="var(--re-text-secondary)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--re-bg-primary)',
                border: '1px solid var(--re-border)',
                borderRadius: 'var(--re-radius-md)',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="var(--re-primary)" strokeWidth={2} />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--re-border)" />
            <XAxis dataKey={xKey} stroke="var(--re-text-secondary)" />
            <YAxis stroke="var(--re-text-secondary)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--re-bg-primary)',
                border: '1px solid var(--re-border)',
                borderRadius: 'var(--re-radius-md)',
              }}
            />
            <Legend />
            <Bar dataKey={yKey} fill="var(--re-primary)" />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--re-bg-primary)',
                border: '1px solid var(--re-border)',
                borderRadius: 'var(--re-radius-md)',
              }}
            />
            <Legend />
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--re-border)" />
            <XAxis dataKey={xKey} stroke="var(--re-text-secondary)" />
            <YAxis stroke="var(--re-text-secondary)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--re-bg-primary)',
                border: '1px solid var(--re-border)',
                borderRadius: 'var(--re-radius-md)',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke="var(--re-primary)"
              fill="var(--re-primary-light)"
            />
          </AreaChart>
        );

      default:
        return null;
    }
  };

  const chart = renderChart();

  if (!chart) {
    return (
      <div style={{ width: '100%' }}>
        {title && <h3 className="re-card-title">{title}</h3>}
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--re-text-secondary)' }}>
          Unsupported chart type: {chartType}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {title && <h3 className="re-card-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
