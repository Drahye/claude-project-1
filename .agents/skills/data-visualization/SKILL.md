---
name: data-visualization
description: Design and build charts, dashboards, and data visualizations using Recharts, D3.js, Observable Plot, and Nivo. Use when building analytics dashboards, choosing chart types, designing data-heavy UIs, or making data stories that communicate clearly.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: design
  type: technical
---

# Data Visualization

You are a data visualization expert. Your goal is to help teams turn raw data into clear, beautiful, and honest visual communication — charts that inform decisions, not just fill space on a dashboard.

## When to Use

- Building an analytics dashboard or reporting feature
- Choosing the right chart type for a dataset
- Making a chart that's currently confusing easier to read
- Implementing charts in React with a charting library
- Designing data-heavy product screens (metrics, funnels, cohorts)
- Creating a data story for stakeholders or users

---

## Chart Type Selection Guide

### Comparison
| Data | Chart Type |
|------|-----------|
| Categories side-by-side | Bar chart (vertical) |
| Many categories | Horizontal bar chart |
| Over time | Line chart |
| Part-of-whole over time | Stacked area chart |

### Trend
| Data | Chart Type |
|------|-----------|
| Single metric over time | Line chart |
| Multiple metrics | Multi-line chart |
| Rate of change | Line with slope emphasis |
| Moving average | Line + shaded band |

### Distribution
| Data | Chart Type |
|------|-----------|
| Data spread | Histogram |
| Outliers + quartiles | Box plot |
| Smooth distribution | Violin plot |

### Part-of-Whole
| Data | Chart Type |
|------|-----------|
| Few categories (≤5) | Donut or pie chart |
| Many categories | Treemap or stacked bar |
| Nested hierarchy | Sunburst |

### Relationship
| Data | Chart Type |
|------|-----------|
| Two variables | Scatter plot |
| Three variables | Bubble chart |
| Correlation matrix | Heatmap |

### Flow / Funnel
| Data | Chart Type |
|------|-----------|
| Conversion steps | Funnel chart |
| Flow between categories | Sankey diagram |

---

## Library Selection

| Library | Best For | Bundle Size |
|---------|----------|------------|
| **Recharts** | React, clean API, good defaults, most popular | Medium |
| **Nivo** | Beautiful out-of-box, motion, many chart types | Large |
| **Observable Plot** | Grammar-of-graphics, data journalism | Small |
| **Tremor** | Dashboard components with charts, pre-styled | Medium |
| **D3.js** | Full control, custom/unique charts, animations | Small (core) |
| **Victory** | React Native + web, accessible | Medium |

**Default**: Recharts for most product dashboards. D3 for custom/unique charts.

---

## Recharts — Core Patterns

### Line Chart
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Jan', revenue: 4200, users: 240 },
  { date: 'Feb', revenue: 5800, users: 310 },
  { date: 'Mar', revenue: 7200, users: 390 },
];

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Bar Chart
```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function ConversionBar({ data }: { data: { stage: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="stage" width={120} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`hsl(${220 - i * 15}, 80%, ${55 + i * 5}%)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Custom Tooltip
```tsx
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}
```

---

## D3 — Custom Charts

Use D3 for charts Recharts can't do (heatmaps, force graphs, custom shapes):

```typescript
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

export function HeatmapChart({ data, width = 600, height = 400 }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear on re-render

    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(data, d => d.value)])
      .interpolator(d3.interpolateBlues);

    svg.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => d.col * 40)
      .attr('y', d => d.row * 40)
      .attr('width', 38)
      .attr('height', 38)
      .attr('rx', 4)
      .attr('fill', d => colorScale(d.value));
  }, [data]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

---

## Dashboard Design Principles

### Layout
- **Hero metric** at top — the one number that matters most
- **Context beneath** — trend, comparison, breakdown
- **Filters above** — date range, segment selector
- **No more than 6-8 charts per dashboard** — cognitive overload is real

### Visual Hierarchy
- Largest chart = most important metric
- Group related metrics spatially
- Use white space generously — data dashboards get cramped fast

### Color
- **Single metric**: one color + lighter shade for comparison
- **Categorical**: max 6-7 distinct colors; after that use patterns or labels
- **Sequential**: single-hue scale (light → dark) for magnitude
- **Diverging**: two-hue scale (red ↔ blue) for positive/negative
- Never use red/green as the only differentiator (colorblind users)

### Formatting
- Round numbers: `$1.2M` not `$1,243,891`
- Show units always: `$`, `%`, `ms`, `users`
- Consistent decimal places per metric
- Relative context: "↑ 12% vs last month" is more useful than a number alone

---

## Accessibility in Charts

- Every chart must have an accessible title and description
- Provide a data table as an alternative to the chart
- Don't rely on color alone — use patterns, labels, icons
- Keyboard navigation for interactive charts

```tsx
<figure role="figure" aria-labelledby="chart-title" aria-describedby="chart-desc">
  <figcaption id="chart-title">Monthly Revenue</figcaption>
  <p id="chart-desc" className="sr-only">
    Line chart showing revenue from January to March, growing from $4,200 to $7,200.
  </p>
  <RevenueChart />
</figure>
```

---

## Performance

- Virtualize large datasets — don't render 10,000 SVG nodes
- Aggregate server-side: send the chart-ready data, not raw rows
- Use canvas for >1000 data points (Recharts has canvas mode via `isAnimationActive=false`)
- Debounce resize observers
- Memoize computed data with `useMemo`

---

## Output Format

Deliver:
1. **Chart type recommendation** — with rationale for the data being shown
2. **Component code** — ready to drop in, with custom tooltip and formatting
3. **Dashboard layout** — hierarchy of metrics and chart arrangement
4. **Color system** — palette for categorical and sequential data
5. **Accessibility checklist** — labels, alt text, keyboard support

## Questions to Ask

1. What data are you visualizing and what decision should it inform?
2. Who is the audience (executives, users, analysts)?
3. What's the tech stack (React, Next.js, mobile)?
4. How much data volume? (static report vs. real-time streaming vs. millions of rows)
5. What does "success" look like — what behavior change do you want from viewers?

## Related Skills

- `design-systems` — Build chart components into your design system
- `analytics` — Instrument the data that feeds these dashboards
- `measure-dashboard-requirements` — Define what to measure before visualizing
- `performance-optimization` — Optimize rendering of data-heavy UIs
- `accessibility` — Make charts usable for everyone
