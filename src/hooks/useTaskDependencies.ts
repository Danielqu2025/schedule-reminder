import { supabase } from '../lib/supabaseClient';
import type { TaskDependency, Task } from '../types/database';

/**
 * Task dependency types
 */
export enum DependencyType {
  FINISH_TO_START = 'finish_to_start', // 前置任务完成后，后置任务才能开始
  START_TO_START = 'start_to_start',     // 前置任务开始后，后置任务才能开始
}

/**
 * Dependency validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  circularPath?: number[];
}

/**
 * Get all dependencies for a task (tasks this task depends on)
 */
export async function getTaskDependencies(taskId: number): Promise<TaskDependency[]> {
  try {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('*')
      .eq('task_id', taskId)
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to get task dependencies:', err);
    return [];
  }
}

/**
 * Get all tasks that depend on this task (successors)
 */
export async function getTaskSuccessors(taskId: number): Promise<TaskDependency[]> {
  try {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('*')
      .eq('depends_on_task_id', taskId)
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to get task successors:', err);
    return [];
  }
}

/**
 * Build dependency graph for circular dependency detection
 */
export function buildDependencyGraph(
  dependencies: TaskDependency[],
  taskId: number
): Map<number, number[]> {
  const graph = new Map<number, number[]>();

  // Initialize graph with all involved tasks
  graph.set(taskId, []);

  // Add all dependencies
  dependencies.forEach(dep => {
    const predecessorId = dep.depends_on_task_id;
    const successorId = dep.task_id;

    // Add predecessor -> successor edge
    if (!graph.has(predecessorId)) {
      graph.set(predecessorId, []);
    }
    graph.get(predecessorId)!.push(successorId);

    // Ensure successor exists in graph
    if (!graph.has(successorId)) {
      graph.set(successorId, []);
    }
  });

  return graph;
}

/**
 * Detect circular dependencies using DFS
 */
export function detectCircularDependencies(
  dependencies: TaskDependency[],
  taskId: number,
  newDependency?: { predecessorId: number; successorId: number }
): ValidationResult {
  // Create a new array including the new dependency if provided
  const allDependencies = newDependency
    ? [...dependencies, {
        id: 0,
        task_id: newDependency.successorId,
        depends_on_task_id: newDependency.predecessorId,
        dependency_type: DependencyType.FINISH_TO_START,
        created_at: new Date().toISOString(),
        deleted_at: null,
      } as TaskDependency]
    : dependencies;

  const graph = buildDependencyGraph(allDependencies, taskId);

  // Use DFS to detect cycles
  const visited = new Set<number>();
  const recursionStack = new Set<number>();
  const parentMap = new Map<number, number | null>();

  function dfs(node: number, parent: number | null = null): boolean {
    visited.add(node);
    recursionStack.add(node);
    parentMap.set(node, parent);

    const neighbors = graph.get(node) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, node)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle - reconstruct the path
        const path: number[] = [];
        let current: number | null = node;

        while (current !== null && current !== neighbor) {
          path.push(current);
          current = parentMap.get(current) || null;
        }

        path.push(neighbor);
        path.reverse();

        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  // Start DFS from the successor task (or from all nodes for initial validation)
  const startNode = newDependency?.successorId ?? taskId;

  if (dfs(startNode, null)) {
    // Reconstruct the circular path
    const circularPath: number[] = [];
    let current: number | null = startNode;

    // Walk back through parent chain
    while (current !== null) {
      circularPath.push(current);
      const parent = parentMap.get(current);

      // Check if we've looped back
      if (parent !== null && parent !== undefined && circularPath.includes(parent)) {
        // Found the cycle start
        const cycleStartIndex = circularPath.indexOf(parent);
        if (cycleStartIndex !== -1) {
          circularPath.push(parent); // Add the node that completes the cycle
        }
        break;
      }

      current = parent ?? null;
    }

    return {
      valid: false,
      error: 'Circular dependency detected',
      circularPath,
    };
  }

  return { valid: true };
}

/**
 * Validate a new dependency
 */
export async function validateNewDependency(
  predecessorId: number,
  successorId: number,
  existingDependencies: TaskDependency[] = []
): Promise<ValidationResult> {
  // Check for self-dependency
  if (predecessorId === successorId) {
    return {
      valid: false,
      error: 'Task cannot depend on itself',
    };
  }

  // Get all dependencies for the successor task
  let allDependencies: TaskDependency[];

  if (existingDependencies.length > 0) {
    allDependencies = existingDependencies;
  } else {
    allDependencies = await getTaskDependencies(successorId);
  }

  // Check for circular dependency
  const circularCheck = detectCircularDependencies(
    allDependencies,
    successorId,
    { predecessorId, successorId }
  );

  if (!circularCheck.valid) {
    return circularCheck;
  }

  return { valid: true };
}

/**
 * Add a task dependency
 */
export async function addTaskDependency(
  successorTaskId: number,
  predecessorTaskId: number,
  dependencyType: DependencyType = DependencyType.FINISH_TO_START
): Promise<{ success: boolean; error?: string; dependency?: TaskDependency }> {
  try {
    // Validate the dependency
    const validation = await validateNewDependency(predecessorTaskId, successorTaskId);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid dependency',
      };
    }

    // Insert the dependency
    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({
        task_id: successorTaskId,
        depends_on_task_id: predecessorTaskId,
        dependency_type: dependencyType,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, dependency: data };
  } catch (err) {
    console.error('Failed to add task dependency:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to add dependency',
    };
  }
}

/**
 * Remove a task dependency
 */
export async function removeTaskDependency(
  dependencyId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('task_dependencies')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', dependencyId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('Failed to remove task dependency:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to remove dependency',
    };
  }
}

/**
 * Get available tasks that can be dependencies (no circular dependency)
 */
export async function getAvailablePredecessorTasks(
  successorId: number,
  teamId?: string
): Promise<Task[]> {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .neq('id', successorId) // Can't depend on itself
      .is('deleted_at', null);

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error('Failed to get available predecessor tasks:', err);
    return [];
  }
}

/**
 * Get dependency chain for a task (all tasks that must complete before this one)
 */
export async function getDependencyChain(taskId: number): Promise<number[]> {
  try {
    const visited = new Set<number>();
    const chain: number[] = [];

    const traverse = async function(id: number): Promise<void> {
      if (visited.has(id)) return;

      visited.add(id);
      const dependencies = await getTaskDependencies(id);

      for (const dep of dependencies) {
        await traverse(dep.depends_on_task_id);
        if (!chain.includes(dep.depends_on_task_id)) {
          chain.push(dep.depends_on_task_id);
        }
      }
    };

    await traverse(taskId);

    return chain;
  } catch (err) {
    console.error('Failed to get dependency chain:', err);
    return [];
  }
}

/**
 * Check if a task can start based on its dependencies
 */
export async function canTaskStart(taskId: number): Promise<boolean> {
  try {
    const dependencies = await getTaskDependencies(taskId);

    for (const dep of dependencies) {
      // Get the predecessor task
      const { data: predecessor } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', dep.depends_on_task_id)
        .single();

      // If dependency is not finished and not cancelled, task cannot start
      if (predecessor && predecessor.status !== 'completed' && predecessor.status !== 'cancelled') {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to check if task can start:', err);
    return true; // Default to true on error
  }
}

/**
 * Get tasks blocked by this task
 */
export async function getBlockedTasks(taskId: number): Promise<Task[]> {
  try {
    const successors = await getTaskSuccessors(taskId);

    if (successors.length === 0) return [];

    const successorIds = successors.map(s => s.task_id);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('id', successorIds)
      .is('deleted_at', null);

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error('Failed to get blocked tasks:', err);
    return [];
  }
}
