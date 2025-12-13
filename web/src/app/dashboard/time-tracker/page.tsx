'use client';

import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_ACTIVE_TIME_ENTRY, GET_TODAY_TIMESHEET, GET_TODAY_SESSIONS, GET_TIME_ENTRIES, GET_TIMESHEETS, CHECK_IN, CHECK_OUT, START_TIME_ENTRY, STOP_TIME_ENTRY, GET_PROJECTS, GET_TASKS, GET_ME, GET_EMPLOYEE_WORK_TYPE, UPDATE_EMPLOYEE_WORK_TYPE } from '@/lib/graphql/queries';
import { WorkType } from '@/types';
import { useState, useEffect } from 'react';
import {
    ClockIcon,
    PlayIcon,
    StopIcon,
    PauseIcon,
    CalendarIcon,
    ChartBarIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    PlusIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    ComputerDesktopIcon,
    HomeIcon
} from '@heroicons/react/24/outline';

export default function TimeTrackerPage() {
    // State management
    const [elapsed, setElapsed] = useState(0);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualEntry, setManualEntry] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        description: '',
        projectId: '',
        taskId: ''
    });
    const [viewMode, setViewMode] = useState<'dashboard' | 'timesheet' | 'reports'>('dashboard');
    const [timesheetFilter, setTimesheetFilter] = useState<'today' | 'week' | 'month'>('week');
    const [showWorkTypeSelector, setShowWorkTypeSelector] = useState(false);
    const [showOnsiteCheckInToast, setShowOnsiteCheckInToast] = useState(false);
    const [showCheckInSuccessToast, setShowCheckInSuccessToast] = useState(false);
    const [isTimerPaused, setIsTimerPaused] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [accumulatedTime, setAccumulatedTime] = useState(0);
    const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
    const [isTabVisible, setIsTabVisible] = useState(true);


    // Apollo Client for cache management
    const client = useApolloClient();

    // GraphQL queries
    const { data: meData, error: meError } = useQuery(GET_ME, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });

    // Get current user ID for filtering
    const currentUserId = meData?.me?.id;

    // Get employee work type
    const { data: workTypeData, refetch: refetchWorkType } = useQuery(GET_EMPLOYEE_WORK_TYPE, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });

    // Get today's sessions for multiple check-ins
    const { data: todaySessionsData, refetch: refetchTodaySessions } = useQuery(GET_TODAY_SESSIONS, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });

    const { data: activeEntryData, refetch: refetchActiveEntry, error: activeEntryError } = useQuery(GET_ACTIVE_TIME_ENTRY, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });
    const { data: todayTimesheetData, refetch: refetchTodayTimesheet, error: todayTimesheetError } = useQuery(GET_TODAY_TIMESHEET, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });
    const { data: timeEntriesData, refetch: refetchTimeEntries, error: timeEntriesError } = useQuery(GET_TIME_ENTRIES, {
        variables: { employeeId: currentUserId },
        skip: !currentUserId,
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });

    // Get tasks assigned to current user
    const { data: myTasksData, error: myTasksError } = useQuery(GET_TASKS, {
        variables: { filters: { assignedToId: currentUserId } },
        skip: !currentUserId,
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });

    // Get projects that have tasks assigned to current user
    const { data: projectsData, error: projectsError } = useQuery(GET_PROJECTS, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });

    // Filter tasks by selected project (only from user's assigned tasks)
    const { data: tasksData, error: tasksError } = useQuery(GET_TASKS, {
        variables: {
            filters: {
                assignedToId: currentUserId,
                projectId: selectedProject
            }
        },
        skip: !currentUserId,
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true
    });

    const activeEntry = activeEntryData?.activeTimeEntry;
    const todayTimesheet = todayTimesheetData?.todayTimesheet;
    const todaySessions = todaySessionsData?.todaySessions || [];
    const employeeWorkType = workTypeData?.employeeWorkType || WorkType.REMOTE;
    const allProjects = projectsData?.projects || [];
    const myTasks = myTasksData?.tasks || [];
    const tasks = tasksData?.tasks || [];

    // Filter projects to only show those that have tasks assigned to current user
    const myProjectIds = [...new Set(myTasks.map((task: any) => task.projectId))];
    const projects = allProjects.filter((project: any) => myProjectIds.includes(project.id));

    // Create lookup maps for project and task names
    const projectMap = new Map(allProjects.map((project: any) => [project.id, project.name]));
    const taskMap = new Map(tasks.map((task: any) => [task.id, task.title]));

    // Check if user has any assigned tasks
    const hasAssignedTasks = myTasks.length > 0;

    // Clear selected project when user changes to avoid showing wrong project
    useEffect(() => {
        if (currentUserId) {
            setSelectedProject('');
        }
    }, [currentUserId]);

    // Refetch all time-related data when user changes to ensure data isolation
    useEffect(() => {
        if (currentUserId) {
            refetchActiveEntry();
            refetchTodayTimesheet();
            refetchTimeEntries();
        }
    }, [currentUserId, refetchActiveEntry, refetchTodayTimesheet, refetchTimeEntries]);

    // Calculate date ranges for week and month
    const getWeekStart = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(now.setDate(diff));
    };

    const getWeekEnd = () => {
        const weekStart = getWeekStart();
        return new Date(weekStart.setDate(weekStart.getDate() + 6));
    };

    const getMonthStart = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    };

    const getMonthEnd = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    };

    // Queries for week and month timesheets
    // Temporarily disabled to debug 400 errors
    // const { data: weekTimesheetsData, error: weekError } = useQuery(GET_TIMESHEETS, {
    //     variables: {
    //         startDate: getWeekStart().toISOString(),
    //         endDate: getWeekEnd().toISOString()
    //     },
    //     skip: true,
    //     onError: (error) => {
    //         console.error('Week timesheets query error:', error);
    //     }
    // });

    // const { data: monthTimesheetsData, error: monthError } = useQuery(GET_TIMESHEETS, {
    //     variables: {
    //         startDate: getMonthStart().toISOString(),
    //         endDate: getMonthEnd().toISOString()
    //     },
    //     skip: true,
    //     onError: (error) => {
    //         console.error('Month timesheets query error:', error);
    //     }
    // });

    const weekTimesheetsData = null;
    const monthTimesheetsData = null;

    // Mutations
    const [checkIn] = useMutation(CHECK_IN, {
        onCompleted: () => {
            refetchActiveEntry();
            refetchTodayTimesheet();
            refetchTodaySessions();
            setShowCheckInSuccessToast(true);
            setTimeout(() => {
                setShowCheckInSuccessToast(false);
            }, 3000);
        },
        onError: (error) => {
            // Check if it's the onsite employee check-in error
            if (error.message.includes('Onsite employees can only check in once per day')) {
                setShowOnsiteCheckInToast(true);
                setTimeout(() => {
                    setShowOnsiteCheckInToast(false);
                }, 3000);
            }
        },
        update: (cache) => {
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'activeTimeEntry' });
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'todayTimesheet' });
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'todaySessions' });
        }
    });
    const [checkOut] = useMutation(CHECK_OUT, {
        onCompleted: () => {
            refetchActiveEntry();
            refetchTodayTimesheet();
            refetchTodaySessions();
        },
        update: (cache) => {
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'activeTimeEntry' });
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'todayTimesheet' });
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'todaySessions' });
        }
    });
    const [startTimer] = useMutation(START_TIME_ENTRY, {
        onCompleted: () => {
            refetchActiveEntry();
            refetchTimeEntries();
            setSelectedProject('');
            setSelectedTask('');
            setTaskDescription('');
        },
        update: (cache) => {
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'activeTimeEntry' });
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'timeEntries' });
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'todayTimesheet' });
        }
    });
    const [stopTimer] = useMutation(STOP_TIME_ENTRY, {
        onCompleted: () => {
            refetchActiveEntry();
            refetchTimeEntries();
        },
        update: (cache) => {
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'activeTimeEntry' });
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'timeEntries' });
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'todayTimesheet' });
        }
    });

    const [updateWorkType] = useMutation(UPDATE_EMPLOYEE_WORK_TYPE, {
        onCompleted: () => {
            refetchWorkType();
            refetchTodaySessions();
            setShowWorkTypeSelector(false);
        },
        update: (cache) => {
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'employeeWorkType' });
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'todaySessions' });
        }
    });

    // Error handling effects
    useEffect(() => {
        if (activeEntryError) {
            console.error('Active entry error:', activeEntryError);
        }
    }, [activeEntryError]);

    useEffect(() => {
        if (todayTimesheetError) {
            console.error('Today timesheet error:', todayTimesheetError);
        }
    }, [todayTimesheetError]);

    useEffect(() => {
        if (timeEntriesError) {
            console.error('Time entries error:', timeEntriesError);
        }
    }, [timeEntriesError]);

    useEffect(() => {
        if (projectsError) {
            console.error('Projects error:', projectsError);
        }
    }, [projectsError]);

    useEffect(() => {
        if (tasksError) {
            console.error('Tasks error:', tasksError);
        }
    }, [tasksError]);

    // Handle timer pause/resume logic
    useEffect(() => {
        if (!activeEntry) {
            // Reset when no active entry
            setAccumulatedTime(0);
            setPauseStartTime(null);
            setIsTimerPaused(false);
            return;
        }

        if (isTimerPaused && !pauseStartTime) {
            // Timer just paused
            setPauseStartTime(Date.now());
        } else if (!isTimerPaused && pauseStartTime) {
            // Timer just resumed
            const pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
            setAccumulatedTime(prev => prev + pauseDuration);
            setPauseStartTime(null);
        }
    }, [isTimerPaused, activeEntry, pauseStartTime]);

    // Page visibility detection - tracks when user is working in other apps
    useEffect(() => {
        if (!activeEntry) return;

        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            setIsTabVisible(isVisible);
            
            // If tab becomes visible, update activity timestamp
            if (isVisible) {
                setLastActivity(Date.now());
                // Resume timer if it was paused due to inactivity
                if (isTimerPaused) {
                    setIsTimerPaused(false);
                }
            }
        };

        // Listen for page visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also listen for window focus/blur events
        const handleFocus = () => {
            setIsTabVisible(true);
            setLastActivity(Date.now());
            if (isTimerPaused) {
                setIsTimerPaused(false);
            }
        };
        
        const handleBlur = () => {
            setIsTabVisible(false);
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [activeEntry, isTimerPaused]);

    // Mouse activity detection - detects when user is at computer
    useEffect(() => {
        if (!activeEntry) return;

        const handleActivity = () => {
            const now = Date.now();
            setLastActivity(now);
            
            // Resume timer if it was paused due to inactivity
            if (isTimerPaused) {
                setIsTimerPaused(false);
            }
        };

        // Listen for all mouse and keyboard activity on the document
        const events = [
            'mousemove', 'mousedown', 'mouseup', 'click', 'dblclick',
            'keypress', 'keydown', 'keyup',
            'scroll', 'wheel', 'touchstart', 'touchend', 'touchmove'
        ];
        
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
        };
    }, [activeEntry, isTimerPaused]);

    // Hybrid inactivity detection - combines tab visibility and mouse activity
    useEffect(() => {
        if (!activeEntry) return;

        const inactivityCheck = setInterval(() => {
            const now = Date.now();
            const inactiveTime = now - lastActivity;
            
            // Only pause if tab is visible (user is at computer but inactive)
            // If tab is not visible, assume user is working in other apps
            if (isTabVisible && inactiveTime >= 60000 && !isTimerPaused) {
                setIsTimerPaused(true);
            }
        }, 1000);

        return () => clearInterval(inactivityCheck);
    }, [activeEntry, lastActivity, isTimerPaused, isTabVisible]);

    // Timer effect - respects pause state
    useEffect(() => {
        if (activeEntry && !isTimerPaused) {
            const interval = setInterval(() => {
                const start = new Date(activeEntry.startTime).getTime();
                const now = new Date().getTime();
                const totalElapsed = Math.floor((now - start) / 1000);
                const adjustedElapsed = totalElapsed - accumulatedTime;
                setElapsed(Math.max(0, adjustedElapsed));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [activeEntry, isTimerPaused, accumulatedTime]);

    // Stop timer when user closes browser window or navigates away
    useEffect(() => {
        if (!activeEntry) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Stop the timer before the page unloads
            stopTimer();
            // Don't show a confirmation dialog - just let the browser close
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [activeEntry, stopTimer]);

    // Utility functions
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimeFromDate = (date: Date | string | null | undefined) => {
        if (!date) return '--:--';
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return '--';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };



    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const calculateDuration = (startTime: string, endTime?: string) => {
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const durationInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
        return formatDuration(durationInSeconds);
    };

    const getAttendanceStatus = () => {
        const activeSession = todaySessions.find((session: any) => session.checkIn && !session.checkOut);

        if (activeSession) {
            return { status: 'Checked In', color: 'green', text: 'Active', icon: CheckCircleIcon };
        }

        const hasCompletedSessions = todaySessions.some((session: any) => session.checkIn && session.checkOut);
        if (hasCompletedSessions) {
            return { status: 'Completed', color: 'blue', text: 'Done', icon: CheckCircleIcon };
        }

        return { status: 'Not Checked In', color: 'yellow', text: 'Pending', icon: ExclamationCircleIcon };
    };

    const attendanceStatus = getAttendanceStatus();

    // Calculate time functions
    const getTodayTotalTime = () => {
        let totalSeconds = 0;

        if (todayTimesheet?.totalHours) {
            totalSeconds += todayTimesheet.totalHours * 3600;
        }

        const todayTimeEntries = timeEntriesData?.timeEntries?.filter((entry: any) => {
            const entryDate = new Date(entry.startTime).toDateString();
            const today = new Date().toDateString();
            return entryDate === today;
        }) || [];

        todayTimeEntries.forEach((entry: any) => {
            if (entry.duration) {
                totalSeconds += entry.duration * 60;
            }
        });

        if (activeEntry) {
            totalSeconds += elapsed;
        }

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${hours}h ${minutes}m`;
    };

    const getWeekTotalTime = () => {
        let totalSeconds = 0;

        const weekTimesheets = (weekTimesheetsData as any)?.timesheets || [];
        weekTimesheets.forEach((timesheet: any) => {
            if (timesheet.totalHours) {
                totalSeconds += timesheet.totalHours * 3600;
            }
        });

        const weekTimeEntries = timeEntriesData?.timeEntries?.filter((entry: any) => {
            const entryDate = new Date(entry.startTime);
            const weekStart = getWeekStart();
            const weekEnd = getWeekEnd();
            return entryDate >= weekStart && entryDate <= weekEnd;
        }) || [];

        weekTimeEntries.forEach((entry: any) => {
            if (entry.duration) {
                totalSeconds += entry.duration * 60;
            }
        });

        if (activeEntry) {
            const entryDate = new Date(activeEntry.startTime);
            const weekStart = getWeekStart();
            const weekEnd = getWeekEnd();
            if (entryDate >= weekStart && entryDate <= weekEnd) {
                totalSeconds += elapsed;
            }
        }

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${hours}h ${minutes}m`;
    };

    const getMonthTotalTime = () => {
        let totalSeconds = 0;

        const monthTimesheets = (monthTimesheetsData as any)?.timesheets || [];
        monthTimesheets.forEach((timesheet: any) => {
            if (timesheet.totalHours) {
                totalSeconds += timesheet.totalHours * 3600;
            }
        });

        const monthTimeEntries = timeEntriesData?.timeEntries?.filter((entry: any) => {
            const entryDate = new Date(entry.startTime);
            const monthStart = getMonthStart();
            const monthEnd = getMonthEnd();
            return entryDate >= monthStart && entryDate <= monthEnd;
        }) || [];

        monthTimeEntries.forEach((entry: any) => {
            if (entry.duration) {
                totalSeconds += entry.duration * 60;
            }
        });

        if (activeEntry) {
            const entryDate = new Date(activeEntry.startTime);
            const monthStart = getMonthStart();
            const monthEnd = getMonthEnd();
            if (entryDate >= monthStart && entryDate <= monthEnd) {
                totalSeconds += elapsed;
            }
        }

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${hours}h ${minutes}m`;
    };

    const getFilteredTimeEntries = () => {
        const entries = timeEntriesData?.timeEntries || [];
        const now = new Date();

        switch (timesheetFilter) {
            case 'today':
                return entries.filter((entry: any) => {
                    const entryDate = new Date(entry.startTime);
                    return entryDate.toDateString() === now.toDateString();
                });
            case 'week':
                const weekStart = getWeekStart();
                const weekEnd = getWeekEnd();
                return entries.filter((entry: any) => {
                    const entryDate = new Date(entry.startTime);
                    return entryDate >= weekStart && entryDate <= weekEnd;
                });
            case 'month':
                const monthStart = getMonthStart();
                const monthEnd = getMonthEnd();
                return entries.filter((entry: any) => {
                    const entryDate = new Date(entry.startTime);
                    return entryDate >= monthStart && entryDate <= monthEnd;
                });
            default:
                return entries;
        }
    };

    const handleStartTimer = () => {
        // If user has assigned tasks, require task selection
        if (hasAssignedTasks && !selectedTask) {
            alert('Please select a task before starting the timer');
            return;
        }

        // If user has no assigned tasks, require description
        if (!hasAssignedTasks && !taskDescription.trim()) {
            alert('Please describe what you are working on before starting the timer');
            return;
        }

        startTimer({
            variables: {
                input: {
                    taskId: selectedTask || null, // Allow null when no tasks assigned
                    description: taskDescription.trim() || `Working on ${getProjectName(selectedProject)}`
                }
            }
        });
    };

    const getProjectName = (projectId: string) => {
        const project = projects.find((p: any) => p.id === projectId);
        return project?.name || 'Unknown Project';
    };

    const getTaskName = (taskId: string) => {
        const task = tasks.find((t: any) => t.id === taskId);
        return task?.title || 'Unknown Task';
    };

    const handleWorkTypeChange = (workType: WorkType) => {
        console.log('Updating work type to:', workType);
        updateWorkType({
            variables: { workType: workType.toString() },
            onError: (error) => {
                console.error('GraphQL Error:', error);
                console.error('Error details:', error.graphQLErrors);
                console.error('Network error:', error.networkError);
            }
        });
    };

    const handleCheckIn = () => {
        checkIn();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Time Tracker</h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage your time, track projects, and boost productivity
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowWorkTypeSelector(true)}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                                {employeeWorkType === WorkType.REMOTE ? (
                                    <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                                ) : (
                                    <HomeIcon className="h-5 w-5 mr-2" />
                                )}
                                {employeeWorkType === WorkType.REMOTE ? 'Remote' : 'Onsite'}
                            </button>
                            <button
                                onClick={() => setShowManualEntry(true)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Manual Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setViewMode('dashboard')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'dashboard'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <ChartBarIcon className="h-5 w-5 mr-2" />
                                Dashboard
                            </div>
                        </button>
                        <button
                            onClick={() => setViewMode('timesheet')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'timesheet'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <DocumentTextIcon className="h-5 w-5 mr-2" />
                                Timesheet
                            </div>
                        </button>
                        <button
                            onClick={() => setViewMode('reports')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'reports'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                                Reports
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {viewMode === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <ClockIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Today</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTodayTotalTime()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <CalendarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{getWeekTotalTime()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{getMonthTotalTime()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <attendanceStatus.icon className={`h-8 w-8 text-${attendanceStatus.color}-600 dark:text-${attendanceStatus.color}-400`} />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{attendanceStatus.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Active Timer Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                                <div className="p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Active Timer
                                    </h2>

                                    {activeEntry ? (
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-green-600 mb-6">
                                                <ClockIcon className="h-16 w-16 text-white" />
                                            </div>
                                            <div className="text-6xl font-bold text-gray-900 dark:text-white mb-4 font-mono">
                                                {formatTime(elapsed)}
                                            </div>
                                            <div className="mb-6">
                                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                                                    {activeEntry.description || 'Working...'}
                                                </p>
                                                {activeEntry.projectId && (
                                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                                        Project: {getProjectName(activeEntry.projectId)}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => stopTimer()}
                                                className="w-full inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                            >
                                                <StopIcon className="h-5 w-5 mr-2" />
                                                Stop Timer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mb-6">
                                                <ClockIcon className="h-16 w-16 text-gray-400" />
                                            </div>
                                            <div className="text-6xl font-bold text-gray-900 dark:text-white mb-4 font-mono">
                                                00:00:00
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                                No active timer
                                            </p>

                                            {/* Project and Task Selection */}
                                            <div className="space-y-4 mb-6">
                                                {!hasAssignedTasks ? (
                                                    <>
                                                        <div className="text-center py-8 px-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                            <InformationCircleIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                                                            <p className="text-blue-800 dark:text-blue-200 font-medium">
                                                                No tasks assigned to you
                                                            </p>
                                                            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                                                                Describe what you're working on below
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                What are you working on?
                                                            </label>
                                                            <textarea
                                                                value={taskDescription}
                                                                onChange={(e) => setTaskDescription(e.target.value)}
                                                                placeholder="Describe your work..."
                                                                rows={3}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Select Project
                                                            </label>
                                                            <select
                                                                value={selectedProject}
                                                                onChange={(e) => {
                                                                    setSelectedProject(e.target.value);
                                                                    setSelectedTask('');
                                                                }}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            >
                                                                <option value="">Choose a project...</option>
                                                                {projects.map((project: any) => (
                                                                    <option key={project.id} value={project.id}>
                                                                        {project.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {selectedProject && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                    Select Task (Optional)
                                                                </label>
                                                                <select
                                                                    value={selectedTask}
                                                                    onChange={(e) => setSelectedTask(e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                                >
                                                                    <option value="">Choose a task...</option>
                                                                    {tasks.map((task: any) => (
                                                                        <option key={task.id} value={task.id}>
                                                                            {task.title}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleStartTimer}
                                                disabled={!hasAssignedTasks && !taskDescription.trim()}
                                                className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors ${(!hasAssignedTasks && !taskDescription.trim())
                                                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                                    }`}
                                            >
                                                <PlayIcon className="h-5 w-5 mr-2" />
                                                Start Timer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Attendance Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                                <div className="p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Daily Attendance
                                    </h2>

                                    <div className="space-y-6">
                                        <div className={`p-4 rounded-lg ${attendanceStatus.color === 'green'
                                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                : attendanceStatus.color === 'blue'
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                                            }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <attendanceStatus.icon className={`h-6 w-6 text-${attendanceStatus.color}-600 dark:text-${attendanceStatus.color}-400 mr-3`} />
                                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {attendanceStatus.status}
                                                    </span>
                                                </div>
                                                <span className={`px-3 py-1 text-sm rounded-full bg-${attendanceStatus.color}-100 text-${attendanceStatus.color}-800 dark:bg-${attendanceStatus.color}-900/20 dark:text-${attendanceStatus.color}-400`}>
                                                    {attendanceStatus.text}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={handleCheckIn}
                                                disabled={
                                                    (employeeWorkType === WorkType.ONSITE && todaySessions.some((s: any) => s.checkIn && !s.checkOut)) ||
                                                    (employeeWorkType === WorkType.REMOTE && todaySessions.some((s: any) => s.checkIn && !s.checkOut))
                                                }
                                                className={`inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${(employeeWorkType === WorkType.ONSITE && todaySessions.some((s: any) => s.checkIn && !s.checkOut)) ||
                                                        (employeeWorkType === WorkType.REMOTE && todaySessions.some((s: any) => s.checkIn && !s.checkOut))
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    }`}
                                            >
                                                <PlayIcon className="h-5 w-5 mr-2" />
                                                {employeeWorkType === WorkType.ONSITE && todaySessions.some((s: any) => s.checkIn)
                                                    ? 'Already Checked In'
                                                    : 'Check In'
                                                }
                                            </button>
                                            <button
                                                onClick={() => checkOut()}
                                                disabled={!todaySessions.some((s: any) => s.checkIn && !s.checkOut)}
                                                className={`inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${!todaySessions.some((s: any) => s.checkIn && !s.checkOut)
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                                                    }`}
                                            >
                                                <StopIcon className="h-5 w-5 mr-2" />
                                                Check Out
                                            </button>
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                            {employeeWorkType === WorkType.REMOTE && todaySessions.length > 0 ? (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Today's Sessions</h4>
                                                    <div className="space-y-2">
                                                        {todaySessions.map((session: any, index: number) => (
                                                            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="flex-shrink-0">
                                                                        <div className={`w-2 h-2 rounded-full ${session.checkIn && !session.checkOut
                                                                                ? 'bg-green-500'
                                                                                : 'bg-gray-400'
                                                                            }`} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            Session {session.sessionNumber}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {formatTimeFromDate(session.checkIn)} - {formatTimeFromDate(session.checkOut) || 'Active'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {session.totalHours ? `${session.totalHours}h` : 'In progress'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {todaySessions.some((s: any) => s.totalHours) && (
                                                        <div className="mt-4 text-center">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Hours Today</p>
                                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                                {todaySessions.reduce((sum: number, s: any) => sum + (s.totalHours || 0), 0).toFixed(2)}h
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="text-center">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Check In</p>
                                                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                                                {formatTimeFromDate(todaySessions[0]?.checkIn)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Check Out</p>
                                                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                                                {formatTimeFromDate(todaySessions[0]?.checkOut)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {todaySessions[0]?.totalHours && (
                                                        <div className="mt-6 text-center">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Hours</p>
                                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                                {todaySessions[0].totalHours.toFixed(2)}h
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'timesheet' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Time Entries
                                    </h2>
                                    <div className="flex items-center space-x-4">
                                        <select
                                            value={timesheetFilter}
                                            onChange={(e) => setTimesheetFilter(e.target.value as 'today' | 'week' | 'month')}
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="today">Today</option>
                                            <option value="week">This Week</option>
                                            <option value="month">This Month</option>
                                        </select>
                                        <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                            Export
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Project
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Task / Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Start Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                End Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Duration
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {getFilteredTimeEntries().map((entry: any) => (
                                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {formatDate(entry.startTime)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {entry.taskId ? (
                                                        (() => {
                                                            const task = tasks.find((t: any) => t.id === entry.taskId);
                                                            const projectName = task ? projectMap.get(task.projectId) as string : 'Unknown Project';
                                                            return (
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {projectName || 'Unknown Project'}
                                                                </p>
                                                            );
                                                        })()
                                                    ) : (
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            No Project
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {entry.taskId ? (
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {(taskMap.get(entry.taskId) as string) || 'Unknown Task'}
                                                            </p>
                                                            {entry.description && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    {entry.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-gray-900 dark:text-white">
                                                                {entry.description || 'No description'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                No task assigned
                                                            </p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {formatTimeFromDate(entry.startTime)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {entry.endTime ? formatTimeFromDate(entry.endTime) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                                                        <span className="text-sm text-gray-900 dark:text-white">
                                                            {entry.endTime ? calculateDuration(entry.startTime, entry.endTime) : calculateDuration(entry.startTime)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.endTime
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                        }`}>
                                                        {entry.endTime ? 'Completed' : 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {getFilteredTimeEntries().length === 0 && (
                                    <div className="text-center py-12">
                                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            No time entries found for the selected period
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'reports' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Weekly Overview
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Total Hours</span>
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">{getWeekTotalTime()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Daily Average</span>
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">6h 24m</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Most Productive Day</span>
                                        <span className="text-xl font-bold text-green-600 dark:text-green-400">Wednesday</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Project Distribution
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Website Redesign</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">45%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Mobile App</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">30%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">API Development</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">25%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Productivity Trends
                            </h3>
                            <div className="grid grid-cols-7 gap-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                    <div key={day} className="text-center">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{day}</p>
                                        <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded relative">
                                            <div
                                                className="absolute bottom-0 w-full bg-blue-500 rounded"
                                                style={{ height: `${Math.random() * 80 + 20}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Manual Entry Modal */}
            {showManualEntry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Manual Time Entry
                            </h3>
                            <button
                                onClick={() => setShowManualEntry(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={manualEntry.date}
                                    onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={manualEntry.startTime}
                                        onChange={(e) => setManualEntry({ ...manualEntry, startTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={manualEntry.endTime}
                                        onChange={(e) => setManualEntry({ ...manualEntry, endTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Project
                                </label>
                                <select
                                    value={manualEntry.projectId}
                                    onChange={(e) => setManualEntry({ ...manualEntry, projectId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select a project...</option>
                                    {projects.map((project: any) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={manualEntry.description}
                                    onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                                    rows={3}
                                    placeholder="Describe your work..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => setShowManualEntry(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // Handle manual entry submission
                                        setShowManualEntry(false);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    Add Entry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Work Type Selector Modal */}
            {showWorkTypeSelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Select Work Type
                            </h3>
                            <button
                                onClick={() => setShowWorkTypeSelector(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Choose your work type to determine check-in/check-out behavior:
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleWorkTypeChange(WorkType.REMOTE)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all ${employeeWorkType === WorkType.REMOTE
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <ComputerDesktopIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                        <div className="text-left">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Remote Work</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Multiple check-ins allowed, flexible hours
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleWorkTypeChange(WorkType.ONSITE)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all ${employeeWorkType === WorkType.ONSITE
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <HomeIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                        <div className="text-left">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Onsite Work</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Single check-in per day, fixed hours
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setShowWorkTypeSelector(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Check-in Success Toast Notification */}
            {showCheckInSuccessToast && (
                <div className="fixed bottom-4 right-4 z-50 animate-pulse">
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-lg max-w-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">
                                    Successfully Checked In
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                    Your work session has started. Have a productive day!
                                </p>
                            </div>
                            <div className="ml-auto pl-3">
                                <button
                                    onClick={() => setShowCheckInSuccessToast(false)}
                                    className="inline-flex text-green-400 hover:text-green-600 focus:outline-none"
                                >
                                    <span className="sr-only">Dismiss</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Onsite Check-in Toast Notification */}
            {showOnsiteCheckInToast && (
                <div className="fixed bottom-4 right-4 z-50 animate-pulse">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg max-w-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-yellow-800">
                                    Already Checked In
                                </p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Onsite employees can only check in once per day. Please check out first.
                                </p>
                            </div>
                            <div className="ml-auto pl-3">
                                <button
                                    onClick={() => setShowOnsiteCheckInToast(false)}
                                    className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
                                >
                                    <span className="sr-only">Dismiss</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
