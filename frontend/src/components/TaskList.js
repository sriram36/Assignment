import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { format, isValid, parseISO } from 'date-fns';

function TaskList({ onEditTask }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    priority: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);

      const response = await axios.get(`http://localhost:5001/api/tasks?${params}`);
      setTasks(response.data);
    } catch (error) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`http://localhost:5001/api/tasks/${taskId}`, {
        status: newStatus
      });
      fetchTasks();
      handleMenuClose();
    } catch (error) {
      setError('Failed to update task status');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5001/api/tasks/${taskId}`);
      fetchTasks();
      handleMenuClose();
    } catch (error) {
      setError('Failed to delete task');
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    
    try {
      await axios.post(`http://localhost:5001/api/tasks/${selectedTask._id}/comments`, {
        text: comment
      });
      setComment('');
      setOpenCommentDialog(false);
      fetchTasks();
    } catch (error) {
      setError('Failed to add comment');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(
        `http://localhost:5001/api/tasks/${selectedTask._id}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      fetchTasks();
      handleMenuClose();
    } catch (error) {
      setError('Failed to upload file');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in-progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <FormControl sx={{ mr: 2, minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter.status}
              label="Status"
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filter.priority}
              label="Priority"
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task._id}>
                <TableCell>{task.title}</TableCell>
                <TableCell>{task.description}</TableCell>
                <TableCell>{task.assignedTo?.name || 'Unassigned'}</TableCell>
                <TableCell>
                  {task.dueDate && isValid(parseISO(task.dueDate))
                    ? format(parseISO(task.dueDate), 'MMM dd, yyyy')
                    : 'No due date'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, task)}>
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange(selectedTask?._id, 'pending')}>
          Mark as Pending
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedTask?._id, 'in-progress')}>
          Mark as In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedTask?._id, 'completed')}>
          Mark as Completed
        </MenuItem>
        <MenuItem onClick={() => {
          setOpenCommentDialog(true);
          handleMenuClose();
        }}>
          Add Comment
        </MenuItem>
        <MenuItem component="label">
          Upload Attachment
          <input
            type="file"
            hidden
            onChange={handleFileUpload}
          />
        </MenuItem>
        {user.role === 'admin' && (
          <>
            <MenuItem onClick={() => {
              onEditTask(selectedTask);
              handleMenuClose();
            }}>
              Edit Task
            </MenuItem>
            <MenuItem onClick={() => handleDelete(selectedTask?._id)}>
              Delete Task
            </MenuItem>
          </>
        )}
      </Menu>

      <Dialog open={openCommentDialog} onClose={() => setOpenCommentDialog(false)}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment"
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCommentDialog(false)}>Cancel</Button>
          <Button onClick={handleCommentSubmit} variant="contained">
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TaskList; 