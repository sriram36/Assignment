const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

// Get all agents
router.get('/', adminAuth, async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new agent
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, email, mobileNumber, password } = req.body;

    // Check if agent already exists
    const existingAgent = await User.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({ message: 'Agent with this email already exists' });
    }

    const agent = new User({
      name,
      email,
      mobileNumber,
      password,
      role: 'agent'
    });

    await agent.save();

    res.status(201).json({
      message: 'Agent created successfully',
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        mobileNumber: agent.mobileNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update agent
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, email, mobileNumber } = req.body;
    const agent = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'agent' },
      { name, email, mobileNumber },
      { new: true }
    ).select('-password');

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete agent
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const agent = await User.findOneAndDelete({ _id: req.params.id, role: 'agent' });
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 