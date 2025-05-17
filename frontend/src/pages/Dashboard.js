import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTasks: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [agentsRes, tasksRes] = await Promise.all([
          axios.get('http://localhost:5001/api/agents'),
          axios.get('http://localhost:5001/api/tasks/distribution')
        ]);

        const totalTasks = tasksRes.data.reduce((acc, curr) => acc + curr.count, 0);
        const completedTasks = tasksRes.data.reduce(
          (acc, curr) => acc + curr.tasks.filter(t => t.status === 'completed').length,
          0
        );

        setStats({
          totalAgents: agentsRes.data.length,
          totalTasks,
          completedTasks
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats(); // Initial fetch

    const intervalId = setInterval(fetchStats, 5000); // Fetch data every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {loading ? <CircularProgress size={24} /> : value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Agents"
            value={stats.totalAgents}
            icon={<PeopleIcon sx={{ color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            icon={<AssignmentIcon sx={{ color: 'secondary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Completed Tasks"
            value={stats.completedTasks}
            icon={<CheckCircleIcon sx={{ color: 'success.main' }} />}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 