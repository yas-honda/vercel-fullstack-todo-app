
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Task } from './types';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/addTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newTaskText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setNewTaskText('');
      await getTasks(); // Refresh the list
    } catch (e) {
      setError('Failed to add task. Please try again.');
      console.error(e);
    } finally {
      setIsSubmitting(false);
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

    if (error) {
      return <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>;
    }

    if (tasks.length === 0) {
      return <p className="text-center text-gray-400">No tasks yet. Add one above!</p>;
    }

    return (
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="bg-gray-800/50 p-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
          >
            <p className="text-gray-200">{task.text}</p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-indigo-900/50">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-gray-800/30 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 border border-gray-700/50">
          <header className="mb-6 text-center">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              Vercel To-Do List
            </h1>
            <p className="text-gray-400 mt-2">Powered by Vercel Postgres & Functions</p>
          </header>

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
