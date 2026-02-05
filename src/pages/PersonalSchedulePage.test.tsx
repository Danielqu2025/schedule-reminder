/**
 * PersonalSchedulePage Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PersonalSchedulePage from './PersonalSchedulePage';
import * as supabase from '../lib/supabaseClient';
import { Schedule, ScheduleUpdate } from '../types/database';

// Mock dependencies
vi.mock('../lib/supabaseClient');
vi.mock('../hooks/useReminderEngine');
vi.mock('../components/Skeletons');

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  </MemoryRouter>
);

describe('PersonalSchedulePage', () => {
  const mockSchedules: Schedule[] = [
    {
      id: 1,
      user_id: 'user123',
      title: 'Test Schedule',
      start_date: '2026-02-15',
      end_date: '2026-02-20',
      description: 'Test description',
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the schedule page', () => {
    render(<PersonalSchedulePage />, { wrapper });

    expect(screen.getByText(/日程管理/i)).toBeInTheDocument();
  });

  it('should load schedules on mount', async () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockSchedules, error: null }),
    });

    render(<PersonalSchedulePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Schedule')).toBeInTheDocument();
    });
  });

  it('should render schedule cards', async () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockSchedules, error: null }),
    });

    render(<PersonalSchedulePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Schedule')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    render(<PersonalSchedulePage />, { wrapper });

    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });

  it('should handle schedule status updates', async () => {
    const mockUpdateStatus = vi.fn().mockResolvedValue({ error: null });
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockSchedules, error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    });

    render(<PersonalSchedulePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Schedule')).toBeInTheDocument();
    });

    const statusButton = screen.getAllByRole('button').find((button) =>
      button.textContent?.includes('待办')
    );

    if (statusButton) {
      fireEvent.click(statusButton);
    }

    expect(mockUpdateStatus).toHaveBeenCalled();
  });

  it('should handle error on load failure', async () => {
    const mockError = new Error('Failed to load schedules');
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    });

    render(<PersonalSchedulePage />, { wrapper });

    await waitFor(() => {
      expect(mockError.message).toBeInTheDocument();
    });
  });
});

describe('PersonalSchedulePage - Schedule Updates', () => {
  const mockSchedule: Schedule = {
    id: 1,
    user_id: 'user123',
    title: 'Test Schedule',
    start_date: '2026-02-15',
    end_date: '2026-02-20',
    description: 'Test description',
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const mockUpdates: ScheduleUpdate[] = [
    {
      id: 1,
      schedule_id: 1,
      user_id: 'user123',
      content: 'Progress update',
      status: 'completed',
      created_at: new Date().toISOString(),
    },
  ];

  it('should load schedule updates', async () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn()
        .mockResolvedValueOnce({ data: [mockSchedule], error: null })
        .mockResolvedValueOnce({ data: mockUpdates, error: null }),
    });

    render(<PersonalSchedulePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Progress update')).toBeInTheDocument();
    });
  });

  it('should create schedule update', async () => {
    const mockCreateUpdate = vi.fn().mockResolvedValue({ error: null });
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn()
        .mockResolvedValueOnce({ data: [mockSchedule], error: null })
        .mockResolvedValueOnce({ data: mockUpdates, error: null }),
      insert: vi.fn().mockResolvedValue({ data: mockUpdates[0], error: null }),
    });

    render(<PersonalSchedulePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Schedule')).toBeInTheDocument();
    });

    const updateButton = screen.getByRole('button', { name: /更新/i });

    if (updateButton) {
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockCreateUpdate).toHaveBeenCalled();
      });
    }
  });
});
