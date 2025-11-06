import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Task } from './types';

// Simple SVG Icons for buttons
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);


const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State for inline editing
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // State for exit animations
  const [exitingTaskIds, setExitingTaskIds] = useState<number[]>([]);
  
  const getTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/getTasks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (e) {
      setError('Failed to fetch tasks. Please try again later.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getTasks();
  }, [getTasks]);

  const handleAddTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/addTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTaskText }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setNewTaskText('');
      await getTasks(); // Refresh list
    } catch (e) {
      setError('Failed to add task. Please try again.');
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    const originalTasks = [...tasks];
    setError(null);

    // Start exit animation
    setExitingTaskIds(prev => [...prev, id]);

    // Wait for animation to finish before removing from state
    setTimeout(() => {
        setTasks(currentTasks => currentTasks.filter(task => task.id !== id));
    }, 300); // Should match animation duration

    try {
      const response = await fetch('/api/deleteTask', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        // Revert on failure
        setError('Failed to delete task.');
        setExitingTaskIds(prev => prev.filter(exitingId => exitingId !== id));
        setTasks(originalTasks);
      }
    } catch (e) {
        // Revert on failure
        setError('Failed to delete task.');
        setExitingTaskIds(prev => prev.filter(exitingId => exitingId !== id));
        setTasks(originalTasks);
        console.error(e);
    }
  };
  
  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const handleUpdateTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTaskId || !editingText.trim()) return;

    const originalTasks = [...tasks];
    // Optimistic UI Update
    const updatedTasks = tasks.map(task => 
      task.id === editingTaskId ? { ...task, text: editingText.trim() } : task
    );
    setTasks(updatedTasks);
    
    const originalEditingId = editingTaskId;
    handleCancelEdit(); // Exit editing mode immediately

    try {
      const response = await fetch('/api/updateTask', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: originalEditingId, text: editingText.trim() }),
      });
      if (!response.ok) {
        setTasks(originalTasks); // Revert on failure
        setError('Failed to update task.');
      }
    } catch (e) {
      setTasks(originalTasks); // Revert on failure
      setError('Failed to update task.');
      console.error(e);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
        </div>
      );
    }

    if (tasks.length === 0 && !error) {
      return <p className="text-center text-gray-400 animate-fade-in">No tasks yet. Add one above!</p>;
    }

    return (
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li 
            key={task.id} 
            className={`bg-gray-800/50 p-4 rounded-lg shadow-md flex items-center justify-between gap-4 transition-all duration-300 ${exitingTaskIds.includes(task.id) ? 'animate-fade-out' : 'animate-fade-in-down'}`}
          >
            {editingTaskId === task.id ? (
              <form onSubmit={handleUpdateTask} className="flex-grow flex items-center gap-2">
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="flex-grow bg-gray-700/50 text-gray-200 placeholder-gray-500 focus:outline-none px-3 py-1 rounded-md border border-gray-600 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md transition-colors">Save</button>
                <button type="button" onClick={handleCancelEdit} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-md transition-colors">Cancel</button>
              </form>
            ) : (
              <>
                <p className="text-gray-200 flex-grow">{task.text}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleStartEdit(task)} className="text-gray-400 hover:text-indigo-400 transition-colors" aria-label="Edit task"><EditIcon /></button>
                  <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-400 transition-colors" aria-label="Delete task"><DeleteIcon /></button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-indigo-900/50">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-gray-800/30 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 border border-gray-700/50 animate-fade-in">
          <header className="mb-6 text-center">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              Vercel To-Do List
            </h1>
            <p className="text-gray-400 mt-2">Powered by Vercel Postgres & Functions</p>
          </header>
          
          {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md mb-4 animate-fade-in-down">{error}</p>}

          <form onSubmit={handleAddTask} className="mb-6">
            <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2 border border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-grow bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none px-2 py-1"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300"
                disabled={!newTaskText.trim() || isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;