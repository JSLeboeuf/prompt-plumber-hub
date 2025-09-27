import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilter } from './SearchFilter';

describe('SearchFilter', () => {
  it('calls onSearchChange when typing', () => {
    const onSearchChange = vi.fn();
    render(
      <SearchFilter
        searchTerm=""
        onSearchChange={onSearchChange}
        placeholder="Rechercher..."
      />
    );

    const input = screen.getByPlaceholderText('Rechercher...');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onSearchChange).toHaveBeenCalledWith('abc');
  });

  it('renders filters and triggers onFilterChange', () => {
    const onFilterChange = vi.fn();
    const filters = [
      { value: 'all', label: 'Tous' },
      { value: 'active', label: 'Actifs' },
    ];
    render(
      <SearchFilter
        searchTerm=""
        onSearchChange={() => {}}
        filters={filters}
        activeFilter="all"
        onFilterChange={onFilterChange}
      />
    );

    fireEvent.click(screen.getByText('Actifs'));
    expect(onFilterChange).toHaveBeenCalledWith('active');
  });
});


