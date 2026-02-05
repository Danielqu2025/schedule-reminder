/**
 * Tests for API layer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as api from '../api';
import { mockSupabase, setupMockSupabase } from '../test/mockSupabase';

// Mock supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

describe('API Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockSupabase();
  });

  describe('scheduleAPI', () => {
    it('should get schedules for user', async () => {
      const userId = 'test-user';
      const schedules = [
        { id: 1, title: 'Test Schedule', user_id: userId, status: 'pending' },
      ];

      setupMockSupabase({ data: schedules, error: null });

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

      setupMockSupabase({ data: expectedSchedule, error: null });

      const result = await api.scheduleAPI.createSchedule(newSchedule);
      expect(result.title).toBe('New Schedule');
      expect(result.id).toBe(2);
    });

    it('should update schedule status', async () => {
      const scheduleId = 1;
      const status = 'completed';

      const { error } = await api.scheduleAPI.updateScheduleStatus(scheduleId, status);
      expect(error).toBeNull();
    });
  });

  describe('taskAPI', () => {
    it('should get tasks for user', async () => {
      const userId = 'test-user';
      const tasks = [
        { id: 1, title: 'Test Task', user_id: userId, status: 'pending' },
      ];

      setupMockSupabase({ data: tasks, error: null });

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

      setupMockSupabase({ data: expectedTask, error: null });

      const result = await api.taskAPI.createTask(newTask);
      expect(result.title).toBe('New Task');
    });
  });

  describe('teamAPI', () => {
    it('should get teams for user', async () => {
      const userId = 'test-user';
      const teams = [
        { id: 1, name: 'Test Team', owner_id: userId, created_at: new Date().toISOString() },
      ];

      setupMockSupabase({ data: teams, error: null });

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

      setupMockSupabase({ data: expectedTeam, error: null });

      const result = await api.teamAPI.createTeam(newTeam);
      expect(result.name).toBe('New Team');
    });
  });

  describe('cacheManager', () => {
    it('should save and get data', async () => {
      const key = 'test-key';
      const value = { test: 'value' };

      await api.cacheManager.save(key, value);
      const retrieved = await api.cacheManager.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const value = await api.cacheManager.get('non-existent-key');
      expect(value).toBeNull();
    });
  });
});
