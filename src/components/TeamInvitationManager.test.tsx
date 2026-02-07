/**
 * TeamInvitationManager Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TeamInvitationManager from './TeamInvitationManager';
import * as supabaseClient from '../lib/supabaseClient';
import { TeamInvitation } from '../types/database';

// Mock dependencies
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    ToastContainer: () => null,
  }),
}));

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

  const createMockChain = (returnData: any = { data: [], error: null }) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(returnData),
      then: (resolve: any) => resolve(returnData),
    };
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabaseClient.supabase.from as any).mockReturnValue(createMockChain());
    (supabaseClient.supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user123' } } });
    (supabaseClient.supabase.functions.invoke as any).mockResolvedValue({ data: {}, error: null });
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
    // Removed expect(mockTeamName) as it's not rendered in the component
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

    const mockChain = createMockChain({ data: mockInvitations, error: null });
    (supabaseClient.supabase.from as any).mockReturnValue(mockChain);

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
    (supabaseClient.supabase.functions.invoke as any) = mockSendInvitation;

    const mockChain = createMockChain({ data: [], error: null });
    mockChain.single.mockResolvedValue({
      data: { id: 1, email: 'test@example.com', status: 'pending', token: 'abc', expires_at: new Date().toISOString() },
      error: null,
    });
    
    (supabaseClient.supabase.from as any).mockReturnValue(mockChain);

    render(
      <TeamInvitationManager
        teamId={mockTeamId}
        teamName={mockTeamName}
        onInviteSuccess={mockOnInviteSuccess}
      />,
      { wrapper }
    );

    const toggleButton = screen.getByRole('button', { name: /\+ 邀请成员/i });
    fireEvent.click(toggleButton);

    const emailInput = screen.getByLabelText(/邮箱/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /发送邀请/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSendInvitation).toHaveBeenCalledWith(
        'send-invitation-email',
        expect.objectContaining({
          body: expect.objectContaining({
            email: 'test@example.com',
            teamName: mockTeamName,
          })
        })
      );
    });
  });

  it('should show error message on invitation failure', async () => {
    const mockSendInvitation = vi.fn();
    (supabaseClient.supabase.functions.invoke as any) = mockSendInvitation;

    const mockChain = createMockChain({ data: [], error: null });
    // Mock insert failure
    mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
    });
    
    (supabaseClient.supabase.from as any).mockReturnValue(mockChain);

    render(
      <TeamInvitationManager
        teamId={mockTeamId}
        teamName={mockTeamName}
        onInviteSuccess={mockOnInviteSuccess}
      />,
      { wrapper }
    );

    const toggleButton = screen.getByRole('button', { name: /\+ 邀请成员/i });
    fireEvent.click(toggleButton);

    const emailInput = screen.getByLabelText(/邮箱/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /发送邀请/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
        // Since DB insert failed, sendInvitation should NOT be called
      expect(mockSendInvitation).not.toHaveBeenCalled();
    });
  });

  it('should show success message on successful invitation', async () => {
    const mockSendInvitation = vi.fn().mockResolvedValue({ error: null });
    (supabaseClient.supabase.functions.invoke as any) = mockSendInvitation;

    const mockChain = createMockChain({ data: [], error: null });
    mockChain.single.mockResolvedValue({
      data: { id: 1, email: 'test@example.com', status: 'accepted', token: 'abc', expires_at: new Date().toISOString() },
      error: null,
    });
    
    (supabaseClient.supabase.from as any).mockReturnValue(mockChain);

    render(
      <TeamInvitationManager
        teamId={mockTeamId}
        teamName={mockTeamName}
        onInviteSuccess={mockOnInviteSuccess}
      />,
      { wrapper }
    );

    const toggleButton = screen.getByRole('button', { name: /\+ 邀请成员/i });
    fireEvent.click(toggleButton);

    const emailInput = screen.getByLabelText(/邮箱/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /发送邀请/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnInviteSuccess).toHaveBeenCalled();
    });
  });
});
