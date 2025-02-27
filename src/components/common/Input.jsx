import React, { forwardRef } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

/**
 * Reusable Input Component
 * 
 * @component
 * @example
 * <Input label="Username" placeholder="Enter username" />
 * <Input type="password" label="Password" error="Password is required" />
 */
const Input = forwardRef(({ 
  type = 'text', 
  label,
  placeholder, 
  value, 
  onChange, 
  name,
  id,
  error,
  disabled = false,
  required = false,
  fullWidth = false,
  helpText,
  ...rest 
}, ref) => {
  const inputId = id || name || `input-${label ? label.toLowerCase().replace(/\s+/g, '-') : ''}`;
  
  return (
    <InputContainer fullWidth={fullWidth}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <RequiredMark>*</RequiredMark>}
        </Label>
      )}
      
      <InputWrapper>
        <StyledInput 
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          hasError={!!error}
          {...rest}
        />
      </InputWrapper>
      
      {helpText && <HelpText>{helpText}</HelpText>}
      {error && <ErrorText>{error}</ErrorText>}
    </InputContainer>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  /** Input type */
  type: PropTypes.string,
  /** Input label */
  label: PropTypes.string,
  /** Input placeholder */
  placeholder: PropTypes.string,
  /** Input value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** OnChange handler */
  onChange: PropTypes.func,
  /** Input name */
  name: PropTypes.string,
  /** Input id */
  id: PropTypes.string,
  /** Error message */
  error: PropTypes.string,
  /** Whether input is disabled */
  disabled: PropTypes.bool,
  /** Whether input is required */
  required: PropTypes.bool,
  /** Whether input should take full width of its container */
  fullWidth: PropTypes.bool,
  /** Help text displayed below the input */
  helpText: PropTypes.string
};

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 6px;
`;

const RequiredMark = styled.span`
  color: #e74c3c;
  margin-left: 4px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input`
  height: 35px;
  width: 100%;
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid ${props => props.hasError ? '#e74c3c' : '#bdc3c7'};
  font-size: 14px;
  color: #2c3e50;
  background-color: ${props => props.disabled ? '#f5f5f5' : 'white'};
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#e74c3c' : '#3498db'};
    box-shadow: 0 0 0 2px ${props => props.hasError ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)'};
  }
  
  &::placeholder {
    color: #95a5a6;
    opacity: 0.7;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const HelpText = styled.p`
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: #e74c3c;
  margin-top: 4px;
`;

export default Input;