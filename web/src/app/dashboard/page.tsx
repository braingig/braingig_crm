'use client';

import { useQuery } from '@apollo/client';
import { GET_ME, GET_PROJECTS, GET_TASKS } from '@/lib/graphql/queries';
import {
    UserGroupIcon,
    FolderIcon,
    ClockIcon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
    const { data: userData } = useQuery(GET_ME);
    const { data: projectsData } = useQuery(GET_PROJECTS);
    const { data: tasksData } = useQuery(GET_TASKS);

    const stats = [
        {
            name: 'Total Employees',
            value: '24',
            icon: UserGroupIcon,
            change: '+4.75%',
            changeType: 'positive',
        },
        {
            name: 'Active Projects',
            value: projectsData?.projects?.filter((p: any) => p.status === 'ACTIVE').length || '0',
            icon: FolderIcon,
            change: '+54.02%',
            changeType: 'positive',
        },
        {
            name: 'Open Tasks',
            value: tasksData?.tasks?.filter((t: any) => t.status !== 'COMPLETED').length || '0',
            icon: ClockIcon,
            change: '-1.39%',
            changeType: 'negative',
        },
        {
            name: 'Monthly Revenue',
            value: '$245K',
            icon: CurrencyDollarIcon,
            change: '+10.18%',
            changeType: 'positive',
        },
    ];

    const recentProjects = projectsData?.projects?.slice(0, 5) || [];
    const recentTasks = tasksData?.tasks?.slice(0, 5) || [];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Overview of your team's performance and activities
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map((stat) => (
                    <div key={stat.name} className="card overflow-hidden">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-lg bg-primary-100 dark:bg-primary-900/20 p-3">
                                    <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {stat.name}
                                </p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div
                                className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium ${stat.changeType === 'positive'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    }`}
                            >
                                {stat.change}
                            </div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                from last month
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Projects */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Projects
                    </h2>
                    <div className="space-y-3">
                        {recentProjects.length > 0 ? (
                            recentProjects.map((project: any) => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {project.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {project.clientName || 'Internal'}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full ${project.status === 'ACTIVE'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}
                                    >
                                        {project.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                No projects yet
                            </p>
                        )}
                    </div>
                </div>

                {/* Recent Tasks */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Tasks
                    </h2>
                    <div className="space-y-3">
                        {recentTasks.length > 0 ? (
                            recentTasks.map((task: any) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {task.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Priority: {task.priority}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full ${task.status === 'COMPLETED'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                : task.status === 'IN_PROGRESS'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}
                                    >
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                No tasks yet
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
