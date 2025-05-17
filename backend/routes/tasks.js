const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');
const User = require('../models/User');
const { adminAuth, auth } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Upload and distribute tasks
router.post('/upload', adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const tasks = [];
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // Read file based on extension
    if (fileExt === '.csv') {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => tasks.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      tasks.push(...data);
    }

    // Validate tasks
    const validTasks = tasks.filter(task => 
      task.FirstName && task.Phone && 
      typeof task.FirstName === 'string' && 
      typeof task.Phone === 'string'
    );

    if (validTasks.length === 0) {
      return res.status(400).json({ message: 'No valid tasks found in the file' });
    }

    // Get all agents
    const agents = await User.find({ role: 'agent' });
    if (agents.length === 0) {
      return res.status(400).json({ message: 'No agents found. Please add agents first.' });
    }

    // Distribute tasks among agents
    const distributedTasks = [];
    const tasksPerAgent = Math.ceil(validTasks.length / agents.length);

    for (let i = 0; i < validTasks.length; i++) {
      const agentIndex = Math.floor(i / tasksPerAgent) % agents.length;
      const task = new Task({
        firstName: validTasks[i].FirstName,
        phone: validTasks[i].Phone,
        notes: validTasks[i].Notes || '',
        agent: agents[agentIndex]._id
      });
      await task.save();
      distributedTasks.push(task);
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      message: 'Tasks uploaded and distributed successfully',
      totalTasks: distributedTasks.length
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task distribution
router.get('/distribution', adminAuth, async (req, res) => {
  try {
    const distribution = await Task.aggregate([
      {
        $group: {
          _id: '$agent',
          count: { $sum: 1 },
          tasks: { $push: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent'
        }
      },
      {
        $unwind: '$agent'
      },
      {
        $project: {
          _id: 0,
          agent: {
            _id: 1,
            name: 1,
            email: 1
          },
          count: 1,
          tasks: {
            _id: 1,
            firstName: 1,
            phone: 1,
            notes: 1,
            status: 1
          }
        }
      }
    ]);

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for specific agent
router.get('/agent/:agentId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ agent: req.params.agentId })
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the authenticated user is the assigned agent or an admin
    // Assuming req.user is populated by the auth middleware
    if (task.agent.toString() !== req.user.id && req.user.role !== 'admin') {
       return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Update allowed fields (e.g., status and notes)
    const { status, notes } = req.body;
    if (status) {
      task.status = status;
    }
    if (notes !== undefined) {
      task.notes = notes;
    }

    await task.save();
    res.json(task);

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 