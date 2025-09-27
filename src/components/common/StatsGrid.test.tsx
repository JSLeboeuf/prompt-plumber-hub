import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsGrid } from './StatsGrid';
import { Activity } from 'lucide-react';

describe('StatsGrid', () => {
  it('renders stats and handles click', () => {
    const onClick = vi.fn();
    render(
      <StatsGrid
        stats={[{ title: 'Calls', value: 10, icon: Activity, onClick }]}
      />
    );
    expect(screen.getByText('Calls')).toBeInTheDocument();
    fireEvent.click(screen.getByText('10'));
    expect(onClick).toHaveBeenCalled();
  });
});


