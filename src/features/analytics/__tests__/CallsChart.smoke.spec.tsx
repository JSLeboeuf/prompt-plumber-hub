import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CallsChart from '../CallsChart';
import { ReactNode } from 'react';

// Mock chart components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe('CallsChart - Smoke Test', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  it('should render without crashing', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CallsChart />
      </QueryClientProvider>
    );

    expect(container).toBeTruthy();
  });

  it('should have proper structure', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CallsChart />
      </QueryClientProvider>
    );

    const chartElement = container.querySelector('div');
    expect(chartElement).toBeTruthy();
  });
});
