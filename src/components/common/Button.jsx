import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

/**
 * Reusable Button Component
 * 
 * @component
 * @example
 * <Button>Default Button</Button>
 * <Button variant="primary">Primary Button</Button>
 * <Button variant="success" size="large">Large Success Button</Button>
 */
const Button = ({ 
  children, 
  variant = 'default', 
  size = 'medium', 
  fullWidth = false, 
  disabled = false, 
  loading = false,
  onClick, 
  type = 'button',
  ...rest 
}) => {
  return (
    <StyledButton 
      type={type}
      variant={variant} 
      size={size} 
      fullWidth={fullWidth} 
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span style={{ marginLeft: '8px' }}>Loading...</span>
        </>
      ) : (
        children
      )}
    </StyledButton>
  );
};

Button.propTypes = {
  /** Button content */
  children: PropTypes.node.isRequired,
  /** Button variant */
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'link']),
  /** Button size */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Whether button should take full width of its container */
  fullWidth: PropTypes.bool,
  /** Whether button is disabled */
  disabled: PropTypes.bool,
  /** Whether button is in loading state */
  loading: PropTypes.bool,
  /** Click handler */
  onClick: PropTypes.func,
  /** Button type attribute */
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

// Variant styles
const getVariantStyles = (variant) => {
  switch (variant) {
    case 'primary':
      return `
        background-color: #3498db;
        color: white;
        &:hover:not(:disabled) {
          background-color: #2980b9;
        }
      `;
    case 'success':
      return `
        background-color: #27ae60;
        color: white;
        &:hover:not(:disabled) {
          background-color: #219955;
        }
      `;
    case 'warning':
      return `
        background-color: #f39c12;
        color: white;
        &:hover:not(:disabled) {
          background-color: #e67e22;
        }
      `;
    case 'danger':
      return `
        background-color: #e74c3c;
        color: white;
        &:hover:not(:disabled) {
          background-color: #c0392b;
        }
      `;
    case 'link':
      return `
        background-color: transparent;
        color: #3498db;
        box-shadow: none;
        &:hover:not(:disabled) {
          text-decoration: underline;
          background-color: transparent;
        }
      `;
    default:
      return `
        background-color: #f5f7fa;
        color: #2c3e50;
        border: 1px solid #ddd;
        &:hover:not(:disabled) {
          background-color: #ecf0f1;
        }
      `;
  }
};

// Size styles
const getSizeStyles = (size) => {
  switch (size) {
    case 'small':
      return `
        height: 30px;
        padding: 0 12px;
        font-size: 12px;
      `;
    case 'large':
      return `
        height: 45px;
        padding: 0 24px;
        font-size: 16px;
      `;
    default:
      return `
        height: 35px;
        padding: 0 16px;
        font-size: 14px;
      `;
  }
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: none;
  transition: all 0.2s ease;
  cursor: pointer;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  
  ${props => getVariantStyles(props.variant)}
  ${props => getSizeStyles(props.size)}
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default Button;