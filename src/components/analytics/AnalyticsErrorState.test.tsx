import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsErrorState } from './AnalyticsErrorState';

describe('AnalyticsErrorState', () => {
  it('renders inline error and triggers retry', () => {
    const onRetry = vi.fn();
    render(<AnalyticsErrorState error="Network error" onRetry={onRetry} variant="inline" />);
    fireEvent.click(screen.getByText('Réessayer'));
    expect(onRetry).toHaveBeenCalled();
  });
});


