import React from 'react';
import { TableCell } from '@/components/ui/table';

/**
 * Table cell that allows text wrapping for long content
 * Used for school and source columns
 */
const TableCellWrap = ({ children, className = '', ...props }) => {
  return (
    <TableCell 
      className={`table-cell-wrap ${className}`}
      {...props}
    >
      {children}
    </TableCell>
  );
};

export default TableCellWrap;
