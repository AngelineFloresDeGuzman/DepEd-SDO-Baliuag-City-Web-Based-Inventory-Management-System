import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 10;

const SchoolsTable = ({
  schools,
  searchQuery,
  onSearchChange,
  levelFilter,
  onLevelChange,
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(schools.length / PAGE_SIZE) || 1;
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return schools.slice(start, start + PAGE_SIZE);
  }, [schools, currentPage]);

  // Reset to page 1 when schools list changes (e.g. search/filter)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [schools.length, searchQuery, levelFilter]);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'Elementary':
        return <Badge variant="secondary">Elementary</Badge>;
      case 'Secondary':
        return <Badge className="bg-info text-info-foreground">Secondary</Badge>;
      case 'Senior High':
        return <Badge className="bg-primary text-primary-foreground">Senior High</Badge>;
      case 'SDO':
        return <Badge className="bg-accent text-accent-foreground">SDO</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <div className="card-elevated">
      {/* Filters */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={onLevelChange}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Elementary">Elementary</SelectItem>
            <SelectItem value="Secondary">Secondary</SelectItem>
            <SelectItem value="Senior High">Senior High</SelectItem>
            <SelectItem value="SDO">SDO</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead className="w-[40%]">School Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="whitespace-nowrap">Last Updated</TableHead>
              <TableHead className="text-right">Completeness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSchools.map((school) => (
              <TableRow
                key={school.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/schools/${school.id}`)}
              >
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>{getLevelBadge(school.level)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(school.lastUpdated).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-semibold ${getScoreColor(school.completenessScore)}`}>
                    {school.completenessScore}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {schools.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No schools found matching your criteria.
        </div>
      )}

      {/* Wizard-style pagination */}
      {schools.length > 0 && totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
            <span className="ml-2 text-muted-foreground/80">
              ({schools.length} schools)
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolsTable;

