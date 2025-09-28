import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGdprCompliance } from '../../hooks/useGdprCompliance';

// Mock supabase
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => Promise.resolve({ error: null }))
  })),
  rpc: vi.fn(() => Promise.resolve({ error: null }))
};

vi.mock('../../integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useGdprCompliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with no consent', () => {
    const { result } = renderHook(() => useGdprCompliance());
    
    expect(result.current.consent).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.isConsentRequired()).toBe(true);
  });

  it('should load consent from localStorage', () => {
    const mockConsent = {
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConsent));

    const { result } = renderHook(() => useGdprCompliance());
    
    expect(result.current.consent).toEqual(mockConsent);
  });

  it('should update consent and save to localStorage', () => {
    const { result } = renderHook(() => useGdprCompliance());

    act(() => {
      result.current.updateConsent({ analytics: true, marketing: false });
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'gdpr_consent',
      expect.stringContaining('"analytics":true')
    );
    expect(result.current.consent?.analytics).toBe(true);
  });

  it('should check consent correctly', () => {
    const mockConsent = {
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConsent));

    const { result } = renderHook(() => useGdprCompliance());
    
    expect(result.current.hasConsent('analytics')).toBe(true);
    expect(result.current.hasConsent('marketing')).toBe(false);
  });

  it('should detect when consent is required (older than 1 year)', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2);
    
    const oldConsent = {
      analytics: true,
      marketing: false,
      timestamp: oldDate.toISOString(),
      version: '1.0'
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(oldConsent));

    const { result } = renderHook(() => useGdprCompliance());
    
    expect(result.current.isConsentRequired()).toBe(true);
  });

  it('should submit GDPR request successfully', async () => {
    const { result } = renderHook(() => useGdprCompliance());

    const mockRequest = {
      type: 'access' as const,
      email: 'test@example.com',
      description: 'I want to access my data'
    };

    let response;
    await act(async () => {
      response = await result.current.submitGdprRequest(mockRequest);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('gdpr_requests');
    expect(response).toEqual({ success: true, error: null });
  });
});