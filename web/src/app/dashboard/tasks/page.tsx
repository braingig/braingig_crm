'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
    PlusIcon,
    FunnelIcon,
    EllipsisHorizontalIcon,
    CalendarIcon,
    ClockIcon,
    XMarkIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import {
    ChevronDownIcon,
    UserCircleIcon,
} from '@heroicons/react/24/solid';
import {
    GET_TASKS,
    GET_PROJECTS,
    GET_USERS,
    GET_ME,
    CREATE_TASK,
    UPDATE_TASK,
    DELETE_TASK,
} from '@/lib/graphql/queries';

const priorityColors: { [key: string]: string } = {
    URGENT: 'bg-red-100 text-red-800 border-red-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-green-100 text-green-800 border-green-200',
};

const columnColors: { [key: string]: string } = {
    TODO: 'bg-gray-50 border-gray-200',
    IN_PROGRESS: 'bg-blue-50 border-blue-200',
    REVIEW: 'bg-purple-50 border-purple-200',
    COMPLETED: 'bg-green-50 border-green-200',
};

const TaskCard = ({ task, onEdit, onDelete, onStatusChange, users }: { 
    task: any; 
    onEdit: (task: any) => void;
    onDelete: (task: any) => void;
    onStatusChange: (taskId: string, newStatus: string) => void;
    users: any[];
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleStatusChange = (newStatus: string) => {
        onStatusChange(task.id, newStatus);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer relative">
            <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {task.title}
                </h3>
                <div className="relative">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <EllipsisHorizontalIcon className="h-4 w-4" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(task);
                                        setShowMenu(false);
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                >
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(task);
                                        setShowMenu(false);
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                                >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {task.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                    {task.priority}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {task.estimatedTime ? `${task.estimatedTime}h` : 'No estimate'}
                </div>
            </div>

            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </div>
                {task.assignedToId && (
                    <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserCircleIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="ml-1 text-xs text-gray-600">
                            {users.find((u: any) => u.id === task.assignedToId)?.name || 'Unassigned'}
                        </span>
                    </div>
                )}
            </div>

            {task.project && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{task.project.name}</span>
                </div>
            )}

            {/* Status Change Buttons */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex gap-1">
                {task.status !== 'TODO' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange('TODO');
                        }}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        To Do
                    </button>
                )}
                {task.status !== 'IN_PROGRESS' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange('IN_PROGRESS');
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                        In Progress
                    </button>
                )}
                {task.status !== 'REVIEW' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange('REVIEW');
                        }}
                        className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                        Review
                    </button>
                )}
                {task.status !== 'COMPLETED' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange('COMPLETED');
                        }}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                        Complete
                    </button>
                )}
            </div>
        </div>
    );
};

const TaskModal = ({ 
    task, 
    isOpen, 
    onClose, 
    onSave, 
    projects, 
    users 
}: {
    task: any | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    projects: any[];
    users: any[];
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        projectId: '',
        assignedToId: '',
        dueDate: '',
        estimatedTime: '',
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'MEDIUM',
                projectId: task.projectId || '',
                assignedToId: task.assignedToId || '',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                estimatedTime: task.estimatedTime?.toString() || '',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                priority: 'MEDIUM',
                projectId: '',
                assignedToId: '',
                dueDate: '',
                estimatedTime: '',
            });
        }
    }, [task, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.title.trim()) {
            alert('Title is required');
            return;
        }
        
        if (!formData.projectId) {
            alert('Project is required');
            return;
        }
        
        // Prepare data with proper date handling
        const submitData: any = {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            priority: formData.priority,
            projectId: formData.projectId,
            estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : undefined,
        };

        // Only include optional fields if they have values
        if (formData.assignedToId) {
            submitData.assignedToId = formData.assignedToId;
        }

        if (formData.dueDate) {
            const dueDate = new Date(formData.dueDate);
            if (!isNaN(dueDate.getTime())) {
                submitData.dueDate = dueDate;
            }
        }

        console.log('Final submit data:', submitData);
        onSave(submitData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                        {task ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project *
                            </label>
                            <select
                                required
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select Project</option>
                                {projects.map((project: any) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assignee
                            </label>
                            <select
                                value={formData.assignedToId}
                                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Unassigned</option>
                                {users.map((user: any) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estimated Time (hours)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={formData.estimatedTime}
                            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                        >
                            {task ? 'Update' : 'Create'} Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const KanbanColumn = ({ 
    title, 
    tasks, 
    status, 
    count, 
    onEditTask, 
    onDeleteTask, 
    onStatusChange,
    users
}: { 
    title: string; 
    tasks: any[]; 
    status: string; 
    count: number;
    onEditTask: (task: any) => void;
    onDeleteTask: (task: any) => void;
    onStatusChange: (taskId: string, newStatus: string) => void;
    users: any[];
}) => {
    return (
        <div className="flex-1 min-w-0">
            <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border ${columnColors[status as keyof typeof columnColors]}`}>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                    {count}
                </span>
            </div>
            <div className="bg-gray-50 rounded-b-lg border border-t-0 border-gray-200 p-3 min-h-[400px]">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onStatusChange={onStatusChange}
                        users={users}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <div className="text-sm">No tasks in {title.toLowerCase()}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TasksPage() {
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [filters, setFilters] = useState({
        projectId: '',
        assignedToId: '',
        priority: '',
    });

    // Temporarily remove filters to debug
    const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery(GET_TASKS, {
        variables: { filters: undefined }, // Remove filters temporarily
    });

    // Debug: Log query state
    console.log('Tasks query state:', {
        loading: tasksLoading,
        error: tasksError,
        data: tasksData,
        filters: filters,
    });

    const { data: projectsData } = useQuery(GET_PROJECTS);
    const { data: usersData } = useQuery(GET_USERS);
    const { data: userData } = useQuery(GET_ME);

    const [createTask] = useMutation(CREATE_TASK);
    const [updateTask] = useMutation(UPDATE_TASK);
    const [deleteTask] = useMutation(DELETE_TASK);

    const tasks = tasksData?.tasks || [];
    const projects = projectsData?.projects || [];
    const users = usersData?.users || [];

    // Debug: Log current tasks
    console.log('Current tasks loaded:', tasks);
    console.log('Tasks by status:', {
        TODO: tasks.filter((t: any) => t.status === 'TODO').length,
        IN_PROGRESS: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        REVIEW: tasks.filter((t: any) => t.status === 'REVIEW').length,
        COMPLETED: tasks.filter((t: any) => t.status === 'COMPLETED').length,
    });

    const columns = [
        { key: 'TODO', title: 'To Do' },
        { key: 'IN_PROGRESS', title: 'In Progress' },
        { key: 'REVIEW', title: 'Review' },
        { key: 'COMPLETED', title: 'Completed' },
    ];

    const getTasksByStatus = (status: string) => {
        return tasks.filter((task: any) => task.status === status);
    };

    const handleCreateTask = () => {
        // Check if projects are available
        if (projects.length === 0) {
            alert('No projects available. Please create a project first.');
            return;
        }
        setEditingTask(null);
        setShowModal(true);
    };

    const handleEditTask = (task: any) => {
        setEditingTask(task);
        setShowModal(true);
    };

    const handleSaveTask = async (data: any) => {
        try {
            console.log('Current user:', userData?.me);
            console.log('Sending data:', data);

            if (editingTask) {
                // For updates, exclude projectId as it's not allowed in UpdateTaskInput
                const { projectId, ...updateData } = data;
                console.log('Update data (without projectId):', updateData);
                
                const result = await updateTask({
                    variables: {
                        id: editingTask.id,
                        input: updateData,
                    },
                });
                console.log('Update result:', result);
            } else {
                const result = await createTask({
                    variables: {
                        input: data,
                    },
                });
                console.log('Create result:', result);
            }
            setShowModal(false);
            console.log('Refetching tasks...');
            const refetchResult = await refetchTasks();
            console.log('Refetch result:', refetchResult);
            console.log('All tasks after refetch:', refetchResult?.data?.tasks);
        } catch (error: any) {
            console.error('Error saving task:', error);
            console.error('GraphQL errors:', error.graphQLErrors);
            console.error('Network error:', error.networkError);
            
            // More detailed error reporting
            if (error.graphQLErrors && error.graphQLErrors.length > 0) {
                const gqlError = error.graphQLErrors[0];
                console.error('GraphQL error details:', gqlError);
                alert(`GraphQL Error: ${gqlError.message}`);
            } else if (error.networkError) {
                console.error('Network error details:', error.networkError);
                console.error('Network error result:', (error.networkError as any)?.result);
                console.error('Network error status:', (error.networkError as any)?.statusCode);
                console.error('Network error text:', (error.networkError as any)?.statusText);
                
                // Try to extract more details from the response
                const result = (error.networkError as any)?.result;
                if (result && result.errors) {
                    alert(`Server Error: ${result.errors.map((e: any) => e.message).join(', ')}`);
                } else {
                    alert(`Network Error: ${error.networkError.message || 'Connection failed'}`);
                }
            } else {
                alert(`Error saving task: ${error.message || 'Unknown error'}`);
            }
        }
    };

    const handleDeleteTask = async (task: any) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTask({
                    variables: { id: task.id },
                });
                refetchTasks();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            await updateTask({
                variables: {
                    id: taskId,
                    input: { status: newStatus },
                },
            });
            refetchTasks();
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({
            projectId: '',
            assignedToId: '',
            priority: '',
        });
    };

    if (tasksLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading tasks...</div>
            </div>
        );
    }

    // Check if user is authenticated
    if (!userData?.me) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Please log in to view tasks.</div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage and track your team's tasks
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <FunnelIcon className="h-4 w-4 mr-2" />
                            Filters
                            {(filters.projectId || filters.assignedToId || filters.priority) && (
                                <span className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></span>
                            )}
                        </button>
                        <button 
                            onClick={() => {
                                console.log('User data:', userData);
                                console.log('Access token:', typeof window !== 'undefined' ? localStorage.getItem('accessToken') : 'N/A');
                                console.log('Refresh token:', typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : 'N/A');
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Debug Auth
                        </button>
                        <button 
                            onClick={handleCreateTask}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Task
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Project
                                </label>
                                <select 
                                    value={filters.projectId}
                                    onChange={(e) => handleFilterChange('projectId', e.target.value)}
                                    className="w-full rounded-md border-gray-300 text-sm"
                                >
                                    <option value="">All Projects</option>
                                    {projects.map((project: any) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assignee
                                </label>
                                <select 
                                    value={filters.assignedToId}
                                    onChange={(e) => handleFilterChange('assignedToId', e.target.value)}
                                    className="w-full rounded-md border-gray-300 text-sm"
                                >
                                    <option value="">All Members</option>
                                    {users.map((user: any) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select 
                                    value={filters.priority}
                                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                                    className="w-full rounded-md border-gray-300 text-sm"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Kanban Board */}
            <div className="flex space-x-4 overflow-x-auto pb-4">
                {columns.map((column) => (
                    <KanbanColumn
                        key={column.key}
                        title={column.title}
                        tasks={getTasksByStatus(column.key)}
                        status={column.key}
                        count={getTasksByStatus(column.key).length}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                        users={users}
                    />
                ))}
            </div>

            {/* Stats Bar */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">T</span>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Total Tasks</p>
                            <p className="text-xs text-gray-500">{tasks.length} active tasks</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-red-600">!</span>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Urgent</p>
                            <p className="text-xs text-gray-500">
                                {tasks.filter((t: any) => t.priority === 'URGENT').length} urgent tasks
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">→</span>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">In Progress</p>
                            <p className="text-xs text-gray-500">
                                {getTasksByStatus('IN_PROGRESS').length} tasks
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-green-600">✓</span>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Completed</p>
                            <p className="text-xs text-gray-500">
                                {getTasksByStatus('COMPLETED').length} tasks
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Modal */}
            <TaskModal
                task={editingTask}
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSaveTask}
                projects={projects}
                users={users}
            />
        </div>
    );
}