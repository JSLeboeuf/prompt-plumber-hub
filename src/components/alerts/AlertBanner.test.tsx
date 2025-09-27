import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertBanner } from './AlertBanner';

describe('AlertBanner', () => {
  it('renders message and dismisses', () => {
    render(
      <AlertBanner type="info" title="Info" message="Hello" dismissible />
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Hello')).toBeNull();
  });
});


