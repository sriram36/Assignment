import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';

function CSVUpload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [distributedData, setDistributedData] = useState(null);

  const validateFile = (file) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Please upload a valid CSV or Excel file');
    }
    return true;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setError('');
    setSuccess('');
    setDistributedData(null);

    try {
      if (selectedFile) {
        validateFile(selectedFile);
        setFile(selectedFile);
      }
    } catch (error) {
      setError(error.message);
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5001/api/tasks/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('File uploaded and distributed successfully');
      setDistributedData(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Contact List
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <input
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            id="csv-file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="csv-file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{ mr: 2 }}
            >
              Select File
            </Button>
          </label>
          {file && (
            <Typography variant="body2" component="span">
              Selected file: {file.name}
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Upload and Distribute'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>

      {distributedData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Distributed Contacts
          </Typography>
          {Object.entries(distributedData).map(([agentName, contacts]) => (
            <Box key={agentName} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {agentName}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>First Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((contact, index) => (
                      <TableRow key={index}>
                        <TableCell>{contact.firstName}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                        <TableCell>{contact.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}

export default CSVUpload; 