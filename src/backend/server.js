const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 5000;
const mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;

// Middleware
app.use(cors());
app.use(express.json());

// Disable mongoose query buffering when disconnected
mongoose.set('bufferCommands', false);


// MongoDB Connection
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Successfully connected to MongoDB.'))
.catch(err => console.error('MongoDB connection error:', err.message));

// Task Schema & Model
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, default: 'General' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// JSON File Database Helper for local fallback
const DB_FILE = path.join(__dirname, 'tasks.json');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function readLocalTasks() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('Error reading local tasks file:', e);
    return [];
  }
}

function writeLocalTasks(tasks) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local tasks file:', e);
  }
}

const TaskService = {
  async find() {
    if (isMongoConnected()) {
      try {
        return await Task.find().sort({ createdAt: -1 });
      } catch (err) {
        console.warn('MongoDB find failed, falling back to local file:', err.message);
      }
    }
    const tasks = readLocalTasks();
    return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async create(taskData) {
    if (isMongoConnected()) {
      try {
        const newTask = new Task(taskData);
        return await newTask.save();
      } catch (err) {
        console.warn('MongoDB save failed, falling back to local file:', err.message);
      }
    }
    const tasks = readLocalTasks();
    const newTask = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...taskData,
      createdAt: new Date().toISOString(),
      category: taskData.category || 'General',
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'To Do'
    };
    tasks.push(newTask);
    writeLocalTasks(tasks);
    return newTask;
  },

  async findByIdAndUpdate(id, updateData) {
    if (isMongoConnected()) {
      try {
        const updated = await Task.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (updated) return updated;
      } catch (err) {
        console.warn('MongoDB update failed, falling back to local file:', err.message);
      }
    }
    const tasks = readLocalTasks();
    const taskIndex = tasks.findIndex(t => t._id === id || t._id?.toString() === id);
    if (taskIndex === -1) return null;
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updateData
    };
    writeLocalTasks(tasks);
    return tasks[taskIndex];
  },

  async findByIdAndDelete(id) {
    if (isMongoConnected()) {
      try {
        const deleted = await Task.findByIdAndDelete(id);
        if (deleted) return deleted;
      } catch (err) {
        console.warn('MongoDB delete failed, falling back to local file:', err.message);
      }
    }
    const tasks = readLocalTasks();
    const taskIndex = tasks.findIndex(t => t._id === id || t._id?.toString() === id);
    if (taskIndex === -1) return null;
    
    const [deleted] = tasks.splice(taskIndex, 1);
    writeLocalTasks(tasks);
    return deleted;
  }
};

// API Routes
// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await TaskService.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, category, priority, status, dueDate } = req.body;
    const savedTask = await TaskService.create({
      title,
      description,
      category,
      priority,
      status,
      dueDate
    });
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await TaskService.findByIdAndUpdate(req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error: error.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const deletedTask = await TaskService.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task successfully deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

// Health check endpoint (very useful for Kubernetes liveness/readiness probes later!)
app.get('/health', (req, res) => {
  res.json({ status: 'UP', database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
