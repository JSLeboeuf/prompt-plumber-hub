import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MetricsCard from '../MetricsCard';
import { Phone } from 'lucide-react';

describe('MetricsCard - Smoke Test', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <MetricsCard
        title="Test Metric"
        value="100"
        change={10}
        icon={<Phone />}
        trend="up"
      />
    );

    expect(container).toBeTruthy();
  });

  it('should display title and value', () => {
    const { getByText } = render(
      <MetricsCard
        title="Test Metric"
        value="100"
        change={10}
        icon={<Phone />}
        trend="up"
      />
    );

    expect(getByText('Test Metric')).toBeTruthy();
    expect(getByText('100')).toBeTruthy();
  });

  it('should render with negative trend', () => {
    const { container } = render(
      <MetricsCard
        title="Test Metric"
        value="50"
        change={-5}
        icon={<Phone />}
        trend="down"
      />
    );

    expect(container).toBeTruthy();
  });
});