/**
 * TeamInvitationManager Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TeamInvitationManager from './TeamInvitationManager';
import * as supabase from '../lib/supabaseClient';
import { TeamInvitation } from '../types/database';
import { ScheduleListSkeleton } from '../components/Skeletons';

// Mock dependencies
vi.mock('../lib/supabaseClient');
vi.mock('../hooks/useToast');

// Mock dependencies
vi.mock('../lib/supabaseClient');
vi.mock('../hooks/useToast');

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

describe('TeamInvitationManager', () => {
  const mockTeamId = 'test-team-id';
  const mockTeamName = 'Test Team';
  const mockOnInviteSuccess = vi.fn();
  const mockShowError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.supabase as any).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
    });
  });

  it('should render the invitation form', () => {
    render(
      <TeamInvitationManager
        teamId={mockTeamId}
        teamName={mockTeamName}
        onInviteSuccess={mockOnInviteSuccess}
      />,
      { wrapper }
    );

    expect(screen.getByText(/邀请成员/i)).toBeInTheDocument();
    expect(screen.getByText(mockTeamName)).toBeInTheDocument();
  });

  it('should show pending invitations', async () => {
    const mockInvitations: TeamInvitation[] = [
      {
        id: 1,
        team_id: 1,
        email: 'test@example.com',
        invited_by: 'user123',
        token: 'test-token',
        status: 'pending',
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    (supabase.supabase as any).from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockInvitations, error: null }),
    });

    render(
      <TeamInvitationManager
        teamId={mockTeamId}
        teamName={mockTeamName}
        onInviteSuccess={mockOnInviteSuccess}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    const mockSendInvitation = vi.fn().mockResolvedValue({ error: null });
    (supabase.supabase as any).from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: { id: 1, email: 'test@example.com', status: 'pending' },
        error: null,
      }),
    });

    render(
      <TeamInvitationManager
        teamId={mockTeamId}
        teamName={mockTeamName}
        onInviteSuccess={mockOnInviteSuccess}
      />,
      { wrapper }
    );

    const emailInput = screen.getByLabelText(/邮箱/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /发送邀请/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSendInvitation).toHaveBeenCalledWith({
        team_id: 1,
        email: 'test@example.com',
        invited_by: expect.any(String),
        expires_at: expect.any(String),
        token: expect.any(String),
      });
    });
  });

  it('should show error message on invitation failure', async () => {
    const mockSendInvitation = vi.fn().mockRejectedValue(
      new Error('Failed to send invitation')
    );

    render(
      <TeamInvitationManager
        teamId={mockTeamId}
        teamName={mockTeamName}
        onInviteSuccess={mockOnInviteSuccess}
      />,
      { wrapper }
    );

    const emailInput = screen.getByLabelText(/邮箱/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /发送邀请/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSendInvitation).toHaveBeenCalled();
    });
  });

  it('should show success message on successful invitation', async () => {
    (supabase.supabase as any).from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: { id: 1, email: 'test@example.com', status: 'accepted' },
        error: null,
      }),
    });

    render(
      <TeamInvitationManager
        teamId={mockTeamId}
        teamName={mockTeamName}
        onInviteSuccess={mockOnInviteSuccess}
      />,
      { wrapper }
    );

    const emailInput = screen.getByLabelText(/邮箱/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /发送邀请/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnInviteSuccess).toHaveBeenCalled();
    });
  });
});
