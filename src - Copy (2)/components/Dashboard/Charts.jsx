// src/components/Dashboard/Charts.jsx
import { 
    Bar, 
    Pie, 
    BarChart as RechartsBarChart, 
    PieChart as RechartsPieChart, 
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell
  } from 'recharts';
  
  const COLORS = ['#667eea', '#0d9488', '#dc2626', '#f59e0b', '#818cf8', '#34d399'];
  
  export function CustomBarChart({ 
    data, 
    showChart = true,
    containerStyle = {},
    chartHeight = 300 
  }) {
    if (!showChart || !data || data.length === 0) return null;
    
    return (
      <div style={{
        width: '100%',
        height: '100%',
        minHeight: `${chartHeight}px`,
        ...containerStyle
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }} // Extra bottom margin for labels
            layout="vertical" // Horizontal bars for better mobile viewing
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              tick={{ fill: '#718096' }}
              axisLine={{ stroke: '#cbd5e0' }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} // More space for labels
              tick={{ fill: '#718096' }}
              axisLine={{ stroke: '#cbd5e0' }}
            />
            <Tooltip 
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar 
              dataKey="value" 
              name="Count"
              radius={[0, 4, 4, 0]} // Rounded corners on right side only
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]} 
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  export function CustomPieChart({ 
    data, 
    showChart = true,
    containerStyle = {},
    chartHeight = 300,
    showLabels = true
  }) {
    if (!showChart || !data || data.length === 0) return null;
  
    return (
      <div style={{
        width: '100%',
        height: '100%',
        minHeight: `${chartHeight}px`,
        ...containerStyle
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              fill="#82ca9d"
              label={showLabels ? ({
                name, 
                percent,
                value
              }) => `${name}\n${value} (${(percent * 100).toFixed(0)}%)` : false}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                value, 
                props.payload.name
              ]}
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              layout="horizontal"
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    );
  }