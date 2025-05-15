
import { useEffect, useState } from "react";
import { Task } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "../components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";

const TaskPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: "", completed: "" });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Task form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskCompleted, setTaskCompleted] = useState(false);

  // Categories
  const categories = ["Personal", "Work", "Health", "Finance", "Other"];

  useEffect(() => {
    fetchTasks();
  }, [filter, sortBy, sortOrder]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      if (filter.category) queryParams.set("category", filter.category);
      if (filter.completed) queryParams.set("completed", filter.completed);
      queryParams.set("sortBy", sortBy);
      queryParams.set("sortOrder", sortOrder);
      
      const response = await fetch(`/api/tasks?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          category: taskCategory,
          completed: taskCompleted,
        }),
      });

      if (!response.ok) throw new Error("Failed to create task");
      
      const newTask = await response.json();
      setTasks([newTask, ...tasks]);
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Task created successfully" });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          category: taskCategory,
          completed: taskCompleted,
        }),
      });

      if (!response.ok) throw new Error("Failed to update task");
      
      const updatedTask = await response.json();
      setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Task updated successfully" });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      setTasks(tasks.filter(task => task.id !== taskId));
      toast({ title: "Success", description: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskCategory(task.category);
    setTaskCompleted(task.completed);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setTaskTitle("");
    setTaskCategory("");
    setTaskCompleted(false);
    setEditingTask(null);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Task Manager</h1>

      {/* Filters and Sorting Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Filter by Category</Label>
            <Select
              value={filter.category}
              onValueChange={(value) => setFilter({ ...filter, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Filter by Status</Label>
            <Select
              value={filter.completed}
              onValueChange={(value) => setFilter({ ...filter, completed: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tasks</SelectItem>
                <SelectItem value="true">Completed</SelectItem>
                <SelectItem value="false">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="createdAt">Creation Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sort Order</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Create New Task Button */}
      <div className="mb-6">
        <Button onClick={openCreateDialog}>Create New Task</Button>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No tasks found. Create a new task to get started.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Checkbox checked={task.completed} disabled />
                    </TableCell>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.category}</TableCell>
                    <TableCell>
                      {new Date(task.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(task)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Task Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Create New Task"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={taskCategory}
                  onValueChange={setTaskCategory}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="completed"
                  checked={taskCompleted}
                  onCheckedChange={(checked) => 
                    setTaskCompleted(checked === true ? true : false)
                  }
                />
                <Label htmlFor="completed">Completed</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTask ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskPage;
