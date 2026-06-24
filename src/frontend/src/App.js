import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft, Calendar, Tag, AlertTriangle, RefreshCw } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');

  // Fetch tasks on component load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks from the server');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          status: 'To Do',
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const newTask = await response.json();
      setTasks((prev) => [newTask, ...prev]);

      // Reset form fields
      setTitle('');
      setDescription('');
      setCategory('Work');
      setPriority('Medium');
      setDueDate('');
    } catch (err) {
      console.error(err);
      alert('Error creating task: ' + err.message);
    }
  };

  const handleUpdateStatus = async (taskId, currentStatus, direction) => {
    const statuses = ['To Do', 'In Progress', 'Done'];
    const currentIndex = statuses.indexOf(currentStatus);
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= statuses.length) return;
    const nextStatus = statuses[nextIndex];

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const updatedTask = await response.json();
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? updatedTask : t))
      );
    } catch (err) {
      console.error(err);
      alert('Error updating task: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error(err);
      alert('Error deleting task: ' + err.message);
    }
  };

  const filterTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <h1>TaskFlow</h1>
          <p>Microservice-ready Task Manager Dashboard</p>
        </div>
        <button onClick={fetchTasks} className="action-btn" title="Refresh Dashboard">
          <RefreshCw size={18} />
        </button>
      </header>

      {error && (
        <div className="glass-panel" style={{ borderColor: 'var(--priority-high)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle color="var(--priority-high)" size={24} />
          <div>
            <h3 style={{ color: 'var(--priority-high)' }}>Connection Error</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{error}</p>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left Side Panel - Task Creator */}
        <div className="glass-panel">
          <h2 className="form-title">
            <Plus size={20} color="var(--primary)" />
            Create Task
          </h2>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label htmlFor="title">Task Title</label>
              <input
                id="title"
                type="text"
                className="form-control"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                className="form-control"
                placeholder="Details or notes about the task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Work">💼 Work</option>
                <option value="Personal">🏡 Personal</option>
                <option value="Learning">📚 Learning</option>
                <option value="Urgent">⚡ Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                className="form-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🔴 High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date (Optional)</label>
              <input
                id="dueDate"
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <button type="submit" className="btn" disabled={!title.trim()}>
              <Plus size={16} /> Add Task
            </button>
          </form>
        </div>

        {/* Right Side Panel - Kanban Board */}
        <main className="board-columns">
          {/* TO DO Column */}
          <div>
            <div className="column-header todo">
              <h2 className="column-title">📋 To Do</h2>
              <span className="task-count">{filterTasksByStatus('To Do').length}</span>
            </div>
            <div className="tasks-container">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>
              ) : filterTasksByStatus('To Do').length === 0 ? (
                <div className="empty-state">No tasks to do. Add one on the left!</div>
              ) : (
                filterTasksByStatus('To Do').map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    formatDate={formatDate}
                    onMove={(dir) => handleUpdateStatus(task._id, task.status, dir)}
                    onDelete={() => handleDeleteTask(task._id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div>
            <div className="column-header progress">
              <h2 className="column-title">⚡ In Progress</h2>
              <span className="task-count">{filterTasksByStatus('In Progress').length}</span>
            </div>
            <div className="tasks-container">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>
              ) : filterTasksByStatus('In Progress').length === 0 ? (
                <div className="empty-state">No tasks in progress.</div>
              ) : (
                filterTasksByStatus('In Progress').map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    formatDate={formatDate}
                    onMove={(dir) => handleUpdateStatus(task._id, task.status, dir)}
                    onDelete={() => handleDeleteTask(task._id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* DONE Column */}
          <div>
            <div className="column-header done">
              <h2 className="column-title">✅ Done</h2>
              <span className="task-count">{filterTasksByStatus('Done').length}</span>
            </div>
            <div className="tasks-container">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>
              ) : filterTasksByStatus('Done').length === 0 ? (
                <div className="empty-state">No completed tasks yet.</div>
              ) : (
                filterTasksByStatus('Done').map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    formatDate={formatDate}
                    onMove={(dir) => handleUpdateStatus(task._id, task.status, dir)}
                    onDelete={() => handleDeleteTask(task._id)}
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TaskCard({ task, formatDate, onMove, onDelete }) {
  const formattedDate = formatDate(task.dueDate);

  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className="task-category">{task.category}</span>
        <span className={`priority-badge ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </div>
      
      <div className="task-title">{task.title}</div>
      
      {task.description && <div className="task-desc">{task.description}</div>}

      <div className="task-meta">
        {formattedDate ? (
          <span className="task-date">
            <Calendar size={12} />
            {formattedDate}
          </span>
        ) : (
          <span />
        )}
        
        <div className="task-actions">
          {task.status !== 'To Do' && (
            <button
              onClick={() => onMove(-1)}
              className="action-btn"
              title="Move Back"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          {task.status !== 'Done' && (
            <button
              onClick={() => onMove(1)}
              className="action-btn"
              title="Move Forward"
            >
              <ArrowRight size={14} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="action-btn delete"
            title="Delete Task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
