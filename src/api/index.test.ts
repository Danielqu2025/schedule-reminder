/**
 * Tests for API layer
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import * as api from '../api';
import { supabase } from '../lib/supabaseClient';

// Mock supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Create the mock chain helper
const createMockChain = (data: any = [], error: any = null) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
  };
  // Make it thenable
  chain.then = (resolve: any) => resolve({ data, error });
  return chain;
};

describe('API Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as Mock).mockReturnValue(createMockChain());
  });

  describe('scheduleAPI', () => {
    it('should get schedules for user', async () => {
      const userId = 'test-user';
      const schedules = [
        { id: 1, title: 'Test Schedule', user_id: userId, status: 'pending' },
      ];

      (supabase.from as Mock).mockReturnValue(createMockChain(schedules));

      const result = await api.scheduleAPI.getSchedules(userId);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Schedule');
    });

    it('should create schedule', async () => {
      const newSchedule = {
        title: 'New Schedule',
        user_id: 'test-user',
        status: 'pending',
      };

      const expectedSchedule = { id: 2, ...newSchedule, created_at: new Date().toISOString() };
      (supabase.from as Mock).mockReturnValue(createMockChain(expectedSchedule));

      const result = await api.scheduleAPI.createSchedule(newSchedule as any);
      expect(result.title).toBe('New Schedule');
      expect(result.id).toBe(2);
    });

    it('should update schedule status', async () => {
      const scheduleId = 1;
      const status = 'completed';

      (supabase.from as Mock).mockReturnValue(createMockChain(null));

      await api.scheduleAPI.updateScheduleStatus(scheduleId, status);
      expect(supabase.from).toHaveBeenCalledWith('schedules');
    });
  });

  describe('taskAPI', () => {
    it('should get tasks for user', async () => {
      const userId = 'test-user';
      const tasks = [
        { id: 1, title: 'Test Task', user_id: userId, status: 'pending' },
      ];

      (supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'team_members') {
            return createMockChain([{ team_id: 1 }]);
        }
        if (table === 'tasks') {
            return createMockChain(tasks);
        }
        return createMockChain([]);
      });

      const result = await api.taskAPI.getTasks(userId);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Task');
    });

    it('should create task', async () => {
      const newTask = {
        title: 'New Task',
        user_id: 'test-user',
        status: 'pending',
      };

      const expectedTask = { id: 1, ...newTask, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      (supabase.from as Mock).mockReturnValue(createMockChain(expectedTask));

      const result = await api.taskAPI.createTask(newTask as any);
      expect(result.title).toBe('New Task');
    });
  });

  describe('teamAPI', () => {
    it('should get teams for user', async () => {
      const userId = 'test-user';
      const teamData = { id: 1, name: 'Test Team', owner_id: userId, created_at: new Date().toISOString() };
      
      const mockResponse = [
        { team_id: 1, teams: teamData }
      ];

      (supabase.from as Mock).mockReturnValue(createMockChain(mockResponse));

      const result = await api.teamAPI.getTeams(userId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Team');
    });

    it('should create team', async () => {
      const newTeam = {
        name: 'New Team',
        owner_id: 'test-user',
      };

      const expectedTeam = { id: 1, ...newTeam, created_at: new Date().toISOString() };
      (supabase.from as Mock).mockReturnValue(createMockChain(expectedTeam));

      const result = await api.teamAPI.createTeam(newTeam);
      expect(result.name).toBe('New Team');
    });
  });
});
