import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

/**
 * Reusable Table Component
 * 
 * @component
 * @example
 * const columns = [
 *   { id: 'name', header: 'Name', width: '150px' },
 *   { id: 'email', header: 'Email', width: '250px' },
 *   { id: 'role', header: 'Role', width: '100px' }
 * ];
 * const data = [
 *   { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
 *   { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
 * ];
 * <Table columns={columns} data={data} />
 */
const Table = ({ 
  columns, 
  data,
  emptyMessage = 'No data available',
  selectable = false,
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  onRowClick,
  isLoading = false,
  loadingMessage = 'Loading data...',
  renderRowActions,
  headerActions
}) => {
  const handleSelectAll = (e) => {
    if (onSelectAll) {
      onSelectAll(e.target.checked, data.map(item => item.id));
    }
  };
  
  const handleSelectRow = (e, id) => {
    e.stopPropagation();
    if (onSelectRow) {
      onSelectRow(id, e.target.checked);
    }
  };
  
  const handleRowClick = (item) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };
  
  return (
    <TableContainer>
      <TableHeader>
        {headerActions}
      </TableHeader>
      
      <StyledTable>
        <thead>
          <tr>
            {selectable && (
              <HeaderCell width="40px">
                <Checkbox 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={data.length > 0 && selectedIds.length === data.length}
                  disabled={data.length === 0}
                />
              </HeaderCell>
            )}
            
            {columns.map(column => (
              <HeaderCell 
                key={column.id} 
                width={column.width}
                align={column.align || 'left'}
              >
                {column.header}
              </HeaderCell>
            ))}
            
            {renderRowActions && (
              <HeaderCell width="100px" align="center">Actions</HeaderCell>
            )}
          </tr>
        </thead>
        
        <tbody>
          {isLoading ? (
            <tr>
              <LoadingCell colSpan={columns.length + (selectable ? 1 : 0) + (renderRowActions ? 1 : 0)}>
                <LoadingContainer>
                  <Spinner />
                  <span>{loadingMessage}</span>
                </LoadingContainer>
              </LoadingCell>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <EmptyCell colSpan={columns.length + (selectable ? 1 : 0) + (renderRowActions ? 1 : 0)}>
                {emptyMessage}
              </EmptyCell>
            </tr>
          ) : (
            data.map(item => (
              <TableRow 
                key={item.id}
                onClick={() => handleRowClick(item)}
                clickable={!!onRowClick}
              >
                {selectable && (
                  <Cell>
                    <Checkbox 
                      type="checkbox" 
                      onChange={(e) => handleSelectRow(e, item.id)}
                      checked={selectedIds.includes(item.id)}
                    />
                  </Cell>
                )}
                
                {columns.map(column => (
                  <Cell 
                    key={`${item.id}-${column.id}`}
                    align={column.align || 'left'}
                  >
                    {column.render ? column.render(item) : item[column.id]}
                  </Cell>
                ))}
                
                {renderRowActions && (
                  <ActionCell>
                    {renderRowActions(item)}
                  </ActionCell>
                )}
              </TableRow>
            ))
          )}
        </tbody>
      </StyledTable>
    </TableContainer>
  );
};

Table.propTypes = {
  /** Table columns configuration */
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      /** Unique column ID */
      id: PropTypes.string.isRequired,
      /** Column header text */
      header: PropTypes.node.isRequired,
      /** Optional column width */
      width: PropTypes.string,
      /** Optional text alignment */
      align: PropTypes.oneOf(['left', 'center', 'right']),
      /** Optional render function for custom cell rendering */
      render: PropTypes.func
    })
  ).isRequired,
  /** Table data array */
  data: PropTypes.array.isRequired,
  /** Message to display when data is empty */
  emptyMessage: PropTypes.string,
  /** Whether to include a selection checkbox column */
  selectable: PropTypes.bool,
  /** Array of selected row IDs */
  selectedIds: PropTypes.array,
  /** Handler for "select all" checkbox */
  onSelectAll: PropTypes.func,
  /** Handler for row selection */
  onSelectRow: PropTypes.func,
  /** Handler for row click */
  onRowClick: PropTypes.func,
  /** Whether the table is loading */
  isLoading: PropTypes.bool,
  /** Message to display during loading */
  loadingMessage: PropTypes.string,
  /** Function to render action buttons for each row */
  renderRowActions: PropTypes.func,
  /** Additional actions to render in the table header */
  headerActions: PropTypes.node
};

const TableContainer = styled.div`
  width: 100%;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
  background-color: white;
`;

const HeaderCell = styled.th`
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
  font-size: 14px;
  color: #2c3e50;
  text-align: ${props => props.align || 'left'};
  width: ${props => props.width || 'auto'};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #ecf0f1;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.clickable ? '#f8f9fa' : 'inherit'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const Cell = styled.td`
  padding: 12px 15px;
  font-size: 14px;
  color: #2c3e50;
  text-align: ${props => props.align || 'left'};
`;

const ActionCell = styled.td`
  padding: 8px 15px;
  text-align: center;
`;

const LoadingCell = styled.td`
  padding: 20px;
  text-align: center;
`;

const EmptyCell = styled.td`
  padding: 40px 0;
  text-align: center;
  color: #7f8c8d;
  font-size: 16px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  color: #7f8c8d;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  cursor: pointer;
  
  &:disabled {
    cursor: not-allowed;
  }
`;

export default Table;