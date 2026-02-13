import React from 'react';
import { TableCell } from '@/components/ui/table';
import { useTruncatedText } from '@/hooks/useTruncatedText';

/**
 * Table cell that automatically adjusts font size when content is truncated
 */
const TableCellAutoFit = ({ children, className = '', ...props }) => {
  const { ref, className: autoFitClassName } = useTruncatedText();

  return (
    <TableCell 
      ref={ref} 
      className={`${autoFitClassName} ${className}`}
      {...props}
    >
      {children}
    </TableCell>
  );
};

export default TableCellAutoFit;
