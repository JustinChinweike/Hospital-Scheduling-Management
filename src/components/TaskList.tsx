
import { Task } from "@/types";
import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  filter: string;
}

const TaskList = ({ tasks, onCompleteTask, onDeleteTask, filter }: TaskListProps) => {
  // Filter tasks based on the selected filter
  const filteredTasks = filter === "all" 
    ? tasks 
    : filter === "completed" 
      ? tasks.filter(task => task.completed) 
      : tasks.filter(task => !task.completed);

  return (
    <div className="space-y-2">
      {filteredTasks.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {filter === "all" ? "No tasks yet. Add one above!" : 
           filter === "completed" ? "No completed tasks yet." : 
           "No pending tasks - you're all caught up!"}
        </div>
      ) : (
        filteredTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onComplete={onCompleteTask}
            onDelete={onDeleteTask}
          />
        ))
      )}
    </div>
  );
};

export default TaskList;
