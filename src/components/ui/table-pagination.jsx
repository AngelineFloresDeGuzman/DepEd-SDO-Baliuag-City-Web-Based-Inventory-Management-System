import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TablePagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemLabel = 'items',
  className = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between gap-4 border-t border-border p-4 ${className}`}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
        {totalItems != null && (
          <span className="ml-2 text-muted-foreground/80">
            ({totalItems} {itemLabel})
          </span>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export { TablePagination };
