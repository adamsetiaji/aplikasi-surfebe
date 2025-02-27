import React, { useState } from 'react';
import styled from 'styled-components';

const SERVER_TYPES = ['Production', 'Testing', 'Development'];

const ServerForm = ({ onSubmit, onTestConnection, initialValues = {} }) => {
  const [formData, setFormData] = useState({
    name: initialValues.name || '',
    url: initialValues.url || '',
    description: initialValues.description || '',
    server_type: initialValues.server_type || 'Production'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    
    // Clear test result when URL changes
    if (name === 'url') {
      setTestResult(null);
    }
  };
  
  const handleTypeSelect = (type) => {
    setFormData({ ...formData, server_type: type });
    setShowTypeDropdown(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        // Reset form on success
        setFormData({
          name: '',
          url: '',
          description: '',
          server_type: 'Production'
        });
        setTestResult(null);
      } else {
        setErrors({ submit: result.error });
      }
    } catch (err) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTestConnection = async () => {
    if (!formData.url) {
      setErrors({ url: 'URL is required for testing connection' });
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await onTestConnection(formData.url);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: 'An unexpected error occurred during connection test.'
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  const validateForm = (data) => {
    const errors = {};
    
    if (!data.name || data.name.trim() === '') {
      errors.name = 'Server name is required';
    }
    
    if (!data.url || data.url.trim() === '') {
      errors.url = 'Server URL is required';
    } else {
      // Simple URL validation
      const urlPattern = /^(https?:\/\/|wss?:\/\/).+/i;
      if (!urlPattern.test(data.url)) {
        errors.url = 'URL must start with http://, https://, ws:// or wss://';
      }
    }
    
    return errors;
  };
  
  return (
    <FormContainer onSubmit={handleSubmit}>
      {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}
      
      <FormRow>
        <FormGroup>
          <Label>Server Name:</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter server name..."
            hasError={!!errors.name}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </FormGroup>
        
        <FormGroup>
          <Label>Server URL:</Label>
          <Input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="ws://, wss://, http://, or https://..."
            hasError={!!errors.url}
          />
          {errors.url && <FieldError>{errors.url}</FieldError>}
        </FormGroup>
        
        <FormGroup>
          <Label>Server Type:</Label>
          <TypeSelector onClick={() => setShowTypeDropdown(!showTypeDropdown)}>
            {formData.server_type}
            <ArrowIcon />
          </TypeSelector>
          
          {showTypeDropdown && (
            <TypeDropdown>
              {SERVER_TYPES.map(type => (
                <TypeOption 
                  key={type} 
                  onClick={() => handleTypeSelect(type)}
                  active={type === formData.server_type}
                >
                  {type}
                </TypeOption>
              ))}
            </TypeDropdown>
          )}
        </FormGroup>
      </FormRow>
      
      <FormRow>
        <FormGroup>
          <Label>Description:</Label>
          <Input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter server description..."
          />
        </FormGroup>
        
        <ButtonGroup>
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Server'}
          </SubmitButton>
          
          <TestButton 
            type="button" 
            onClick={handleTestConnection} 
            disabled={isTesting || !formData.url}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </TestButton>
        </ButtonGroup>
      </FormRow>
      
      {testResult && (
        <TestResultContainer success={testResult.success}>
          {testResult.success 
            ? 'Connection successful!' 
            : `Connection failed: ${testResult.error}`}
        </TestResultContainer>
      )}
    </FormContainer>
  );
};

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
`;

const Label = styled.label`
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const Input = styled.input`
  height: 35px;
  border-radius: 4px;
  border: 1px solid ${props => props.hasError ? '#e74c3c' : '#bdc3c7'};
  padding: 0 10px;
  font-size: 14px;
  
  &::placeholder {
    color: #95a5a6;
    opacity: 0.7;
  }
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TypeSelector = styled.div`
  height: 35px;
  border-radius: 4px;
  border: 1px solid #bdc3c7;
  background-color: white;
  padding: 0 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f7fa;
  }
`;

const ArrowIcon = styled.span`
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #95a5a6;
`;

const TypeDropdown = styled.div`
  position: absolute;
  top: 70px;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const TypeOption = styled.div`
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  background-color: ${props => props.active ? '#f5f7fa' : 'white'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  
  &:hover {
    background-color: #f5f7fa;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-self: flex-end;
  margin-top: auto;
`;

const Button = styled.button`
  height: 35px;
  border-radius: 4px;
  border: none;
  padding: 0 20px;
  font-size: 14px;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #27ae60;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #219955;
  }
`;

const TestButton = styled(Button)`
  background-color: #3498db;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #2980b9;
  }
`;

const ErrorMessage = styled.div`
  background-color: #fdeded;
  border: 1px solid #f1a9a9;
  border-radius: 4px;
  padding: 10px 15px;
  color: #e74c3c;
`;

const FieldError = styled.span`
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
`;

const TestResultContainer = styled.div`
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
  background-color: ${props => props.success ? '#edf7ed' : '#fdeded'};
  border: 1px solid ${props => props.success ? '#a9f1a9' : '#f1a9a9'};
  color: ${props => props.success ? '#27ae60' : '#e74c3c'};
`;

export default ServerForm;