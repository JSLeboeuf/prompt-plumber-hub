import { render } from '@testing-library/react';
import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1' }, profile: { role: 'admin' }, loading: false, canAccess: () => true })
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => () => {},
}));

describe('ProtectedRoute', () => {
  it('renders children when authorized', () => {
    const { getByText } = render(
      <ProtectedRoute>
        <div>ok</div>
      </ProtectedRoute>
    );
    expect(getByText('ok')).toBeTruthy();
  });
});


