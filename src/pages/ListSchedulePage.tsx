
import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Edit, Trash, Plus, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSchedule } from "../context/ScheduleContext";
import { toast } from "../components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const departments = [
  "All",
  "Cardiology",
  "Neurology",
  "Pediatrics", 
  "Orthopedics",
  "Oncology",
  "Emergency",
  "Surgery",
  "Internal Medicine",
  "Dermatology",
  "Psychiatry"
];

const ListSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { schedules, loading, currentPage, totalPages, fetchSchedules, deleteSchedule } = useSchedule();

  // Filters state
  const [doctorFilter, setDoctorFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [sortBy, setSortBy] = useState("dateTime");
  const [sortOrder, setSortOrder] = useState("ASC");
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to access this page",
        variant: "destructive"
      });
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  const applyFilters = () => {
    // Build filter object
    const filters: Record<string, string> = { 
      sortBy, 
      order: sortOrder 
    };
    
    if (doctorFilter) filters.doctorName = doctorFilter;
    if (patientFilter) filters.patientName = patientFilter;
    if (departmentFilter !== "All") filters.department = departmentFilter;
    
    fetchSchedules(1, filters);
  };
  
  const resetFilters = () => {
    setDoctorFilter("");
    setPatientFilter("");
    setDepartmentFilter("All");
    setSortBy("dateTime");
    setSortOrder("ASC");
    
    fetchSchedules(1, {});
  };
  
  const handlePageChange = (page: number) => {
    fetchSchedules(page);
  };
  
  const confirmDelete = (id: string) => {
    setScheduleToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!scheduleToDelete) return;
    
    const success = await deleteSchedule(scheduleToDelete);
    
    if (success) {
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    }
  };
  
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="mr-1" /> Back
      </Button>

      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Schedule List</h1>
          <Button 
            onClick={() => navigate("/add-schedule")}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
        
        {/* Filters Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter and sort the schedule list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="doctorFilter" className="block text-sm font-medium mb-1">
                  Doctor Name
                </label>
                <div className="flex">
                  <Input
                    id="doctorFilter"
                    placeholder="Filter by doctor"
                    value={doctorFilter}
                    onChange={(e) => setDoctorFilter(e.target.value)}
                    className="rounded-r-none"
                  />
                  <Button 
                    variant="secondary" 
                    className="rounded-l-none"
                    onClick={applyFilters}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label htmlFor="patientFilter" className="block text-sm font-medium mb-1">
                  Patient Name
                </label>
                <Input
                  id="patientFilter"
                  placeholder="Filter by patient"
                  value={patientFilter}
                  onChange={(e) => setPatientFilter(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="departmentFilter" className="block text-sm font-medium mb-1">
                  Department
                </label>
                <Select 
                  value={departmentFilter} 
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium mb-1">
                  Sort By
                </label>
                <Select 
                  value={sortBy} 
                  onValueChange={setSortBy}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dateTime">Date & Time</SelectItem>
                    <SelectItem value="doctorName">Doctor Name</SelectItem>
                    <SelectItem value="patientName">Patient Name</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-medium mb-1">
                  Sort Order
                </label>
                <Select 
                  value={sortOrder} 
                  onValueChange={setSortOrder}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASC">Ascending</SelectItem>
                    <SelectItem value="DESC">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
              <Button 
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Schedules Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">Loading schedules...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No schedules found. Try adjusting your filters or add a new schedule.
              </div>
            ) : (
              <>
                <Table>
                  <TableCaption>
                    Showing page {currentPage} of {totalPages}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>{schedule.doctorName}</TableCell>
                        <TableCell>{schedule.patientName}</TableCell>
                        <TableCell>{schedule.department}</TableCell>
                        <TableCell>{formatDateTime(schedule.dateTime)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/edit-schedule/${schedule.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(schedule.id)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-1 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i}
                        variant={i + 1 === currentPage ? "default" : "outline"}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListSchedulePage;
