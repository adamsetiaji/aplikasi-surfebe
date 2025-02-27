/**
 * Utility functions for the application
 */

/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @param {object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, defaultOptions);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };
  
  /**
   * Format time from ISO date string to 12-hour format (e.g., 09:45 AM)
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted time string
   */
  export const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error formatting time:', e);
      return dateString;
    }
  };
  
  /**
   * Check if a URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether the URL is valid
   */
  export const isValidUrl = (url) => {
    const pattern = /^(https?:\/\/|wss?:\/\/)(.+)$/i;
    return pattern.test(url);
  };
  
  /**
   * Generate a random alphanumeric ID
   * @param {number} length - Length of the ID
   * @returns {string} - Random ID
   */
  export const generateId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    
    for (let i = 0; i < length; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return id;
  };
  
  /**
   * Format bytes to a human-readable string
   * @param {number} bytes - Bytes to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} - Formatted string (e.g., "1.5 MB")
   */
  export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  /**
   * Debounce a function call
   * @param {function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {function} - Debounced function
   */
  export const debounce = (func, wait = 300) => {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  /**
   * Throttle a function call
   * @param {function} func - Function to throttle
   * @param {number} limit - Limit in milliseconds
   * @returns {function} - Throttled function
   */
  export const throttle = (func, limit = 300) => {
    let inThrottle;
    
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
  
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  export const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  };
  
  /**
   * Parse error message from API response
   * @param {Object|string} error - Error object or string
   * @returns {string} - Formatted error message
   */
  export const parseErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred';
    
    if (typeof error === 'string') return error;
    
    if (error.message) return error.message;
    
    if (error.error) return error.error;
    
    return 'An unknown error occurred';
  };
  
  /**
   * Sleep function to pause execution
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after the specified time
   */
  export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  /**
   * Get server type color
   * @param {string} type - Server type
   * @returns {string} - Color code
   */
  export const getServerTypeColor = (type) => {
    switch (type) {
      case 'Production':
        return '#27ae60';
      case 'Testing':
        return '#f39c12';
      case 'Development':
        return '#3498db';
      default:
        return '#7f8c8d';
    }
  };
  
  /**
   * Get server status badge properties
   * @param {string} status - Server status
   * @returns {Object} - Badge properties (color, text color, width)
   */
  export const getStatusBadgeProps = (status) => {
    switch (status) {
      case 'Online':
        return {
          backgroundColor: '#27ae60',
          textColor: 'white',
          width: '60px'
        };
      case 'Offline':
        return {
          backgroundColor: '#e74c3c',
          textColor: 'white',
          width: '80px'
        };
      case 'Maintenance':
        return {
          backgroundColor: '#f39c12',
          textColor: 'white',
          width: '95px'
        };
      case 'Active':
        return {
          backgroundColor: '#27ae60',
          textColor: 'white',
          width: '60px'
        };
      case 'Inactive':
        return {
          backgroundColor: '#e74c3c',
          textColor: 'white',
          width: '80px'
        };
      case 'Pending':
        return {
          backgroundColor: '#f39c12',
          textColor: 'white',
          width: '80px'
        };
      default:
        return {
          backgroundColor: '#7f8c8d',
          textColor: 'white',
          width: '70px'
        };
    }
  };