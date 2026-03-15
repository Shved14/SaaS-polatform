"use client";

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';

interface BoardStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

export function useBoardData(initialTasks: Task[] = []) {
  console.log('useBoardData called with', initialTasks?.length || 0, 'tasks');

  const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
  const [stats, setStats] = useState<BoardStats>({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0
  });

  // Обновляем статистику при изменении задач
  useEffect(() => {
    setStats({
      total: tasks.length,
      todo: tasks.filter(task => task.status === 'TODO').length,
      inProgress: tasks.filter(task => task.status === 'IN_PROGRESS').length,
      review: tasks.filter(task => task.status === 'REVIEW').length,
      done: tasks.filter(task => task.status === 'DONE').length
    });
  }, [tasks]);

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    );
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  return {
    tasks,
    stats,
    moveTask,
    setTasks,
    handleTaskCreated
  };
}
