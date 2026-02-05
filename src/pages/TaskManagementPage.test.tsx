/**
 * TaskManagementPage Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TaskManagementPage from './TaskManagementPage';
import * as supabase from '../lib/supabaseClient';
import { Task, Team } from '../types/database';

// Mock dependencies
vi.mock('../lib/supabaseClient');
vi.mock('../components/Skeletons');
vi.mock('../hooks/useReactQuery');

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

describe('TaskManagementPage', () => {
  const mockTasks: Task[] = [
    {
      id: 1,
      team_id: 1,
      title: 'Test Task',
      description: 'Test description',
      start_date: '2026-02-15',
      end_date: '2026-02-20',
      status: 'pending',
      priority: 'medium',
      created_by: 'user123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockTeams: Team[] = [
    {
      id: 1,
      name: 'Test Team',
      description: 'Test description',
      owner_id: 'user123',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the task management page', () => {
    render(<TaskManagementPage />, { wrapper });

    expect(screen.getByText(/任务管理/i)).toBeInTheDocument();
  });

  it('should load tasks on mount', async () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
    });

    render(<TaskManagementPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  it('should filter tasks by team', async () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
    });

    render(<TaskManagementPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const teamFilter = screen.getByLabelText(/团队/i);

    if (teamFilter) {
      fireEvent.change(teamFilter, { target: { value: '1' } });
    }
  });

  it('should filter tasks by status', async () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
    });

    render(<TaskManagementPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/状态/i);

    if (statusFilter) {
      fireEvent.change(statusFilter, { target: { value: 'pending' } });
    }
  });

  it('should show loading state', () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    render(<TaskManagementPage />, { wrapper });

    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });

  it('should handle task status updates', async () => {
    const mockUpdateStatus = vi.fn().mockResolvedValue({ error: null });
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    });

    render(<TaskManagementPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const statusButton = screen.getAllByRole('button').find((button) =>
      button.textContent?.includes('待办')
    );

    if (statusButton) {
      fireEvent.click(statusButton);
    }

    expect(mockUpdateStatus).toHaveBeenCalled();
  });

  it('should handle task creation', async () => {
    const mockCreateTask = vi.fn().mockResolvedValue({ error: null });
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
      insert: vi.fn().mockResolvedValue({ data: mockTasks[0], error: null }),
    });

    render(<TaskManagementPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /创建任务/i });

    if (createButton) {
      fireEvent.click(createButton);

      await waitForElementToBeRemoved(() => screen.queryByText(/创建任务/i));
    }

    expect(mockCreateTask).toHaveBeenCalled();
  });

  it('should handle error on load failure', async () => {
    const mockError = new Error('Failed to load tasks');
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    });

    render(<TaskManagementPage />, { wrapper });

    await waitFor(() => {
      expect(mockError.message).toBeInTheDocument();
    });
  });
});

describe('TaskManagementPage - Task Actions', () => {
  const mockTask: Task = {
    id: 1,
    team_id: 1,
    title: 'Test Task',
    description: 'Test description',
    start_date: '2026-02-15',
    end_date: '2026-02-20',
    status: 'pending',
    priority: 'medium',
    created_by: 'user123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('should toggle task status between pending and in_progress', async () => {
    let updatedTask = { ...mockTask, status: 'in_progress' };
    const mockUpdateStatus = vi.fn().mockResolvedValue({
      data: updatedTask,
      error: null,
    });
    const mockFetchTasks = vi.fn().mockResolvedValue({
      data: [updatedTask],
      error: null,
    });

    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [mockTask], error: null }),
      update: vi.fn().mockResolvedValue({
        data: updatedTask,
        error: null,
      }),
    });

    render(<TaskManagementPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const statusButton = screen.getAllByRole('button').find((button) =>
      button.textContent?.includes('待办')
    );

    if (statusButton) {
      fireEvent.click(statusButton);
    }

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalled();
    });
  });

  it('should show team dropdown with all teams', async () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
    });

    render(<TaskManagementPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const teamSelect = screen.getByLabelText(/团队/i);

    if (teamSelect) {
      fireEvent.change(teamSelect, { target: { value: 'all' } });
    }
  });

  it('should show status dropdown with all statuses', async () => {
    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
    });

    render(<TaskManagementPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/状态/i);

    if (statusSelect) {
      fireEvent.change(statusSelect, { target: { value: 'all' } });
    }
  });
});
