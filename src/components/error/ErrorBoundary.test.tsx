import { render, screen } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from './ErrorBoundary';

function Boom() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders fallback on error', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Erreur Application/i)).toBeInTheDocument();
  });
});


