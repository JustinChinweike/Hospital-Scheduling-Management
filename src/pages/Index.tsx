
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task } from "@/types";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";

const categories = ["Work", "Personal", "Shopping", "Health"];

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Load tasks from localStorage on initial render
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (title: string, category: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      category,
      completed: false,
      createdAt: new Date(),
    };

    setTasks([newTask, ...tasks]);
    toast({
      title: "Task added",
      description: `"${title}" has been added to your tasks.`,
    });
  };

  const handleCompleteTask = (id: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { 
            ...task, 
            completed: !task.completed 
          };
          
          if (updatedTask.completed) {
            toast({
              title: "Task completed",
              description: `"${task.title}" marked as complete!`,
            });
          }
          
          return updatedTask;
        }
        return task;
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (taskToDelete) {
      setTasks(tasks.filter((task) => task.id !== id));
      toast({
        title: "Task deleted",
        description: `"${taskToDelete.title}" has been removed.`,
      });
    }
  };

  // Count tasks for each status
  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Task Manager</h1>
            <p className="text-gray-600">Stay organized and get things done</p>
          </div>

          <TaskForm categories={categories} onAddTask={handleAddTask} />

          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveFilter}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">
                  All ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({pendingCount})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedCount})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              <TaskList
                tasks={tasks}
                onCompleteTask={handleCompleteTask}
                onDeleteTask={handleDeleteTask}
                filter="all"
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-0">
              <TaskList
                tasks={tasks}
                onCompleteTask={handleCompleteTask}
                onDeleteTask={handleDeleteTask}
                filter="pending"
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <TaskList
                tasks={tasks}
                onCompleteTask={handleCompleteTask}
                onDeleteTask={handleDeleteTask}
                filter="completed"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
