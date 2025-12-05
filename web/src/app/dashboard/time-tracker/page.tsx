'use client';

import { useQuery, useMutation } from '@apollo/client';
import { GET_ACTIVE_TIME_ENTRY, GET_TODAY_TIMESHEET, CHECK_IN, CHECK_OUT, START_TIME_ENTRY, STOP_TIME_ENTRY } from '@/lib/graphql/queries';
import { useState, useEffect } from 'react';
import { ClockIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';

export default function TimeTrackerPage() {
    const { data: activeEntryData, refetch: refetchActiveEntry } = useQuery(GET_ACTIVE_TIME_ENTRY);
    const { data: todayTimesheetData, refetch: refetchTodayTimesheet } = useQuery(GET_TODAY_TIMESHEET);
    const [checkIn] = useMutation(CHECK_IN, { onCompleted: () => {
        refetchActiveEntry();
        refetchTodayTimesheet();
    }});
    const [checkOut] = useMutation(CHECK_OUT, { onCompleted: () => {
        refetchActiveEntry();
        refetchTodayTimesheet();
    }});
    const [startTimer] = useMutation(START_TIME_ENTRY, { onCompleted: () => refetchActiveEntry() });
    const [stopTimer] = useMutation(STOP_TIME_ENTRY, { onCompleted: () => refetchActiveEntry() });

    const [elapsed, setElapsed] = useState(0);
    const activeEntry = activeEntryData?.activeTimeEntry;
    const todayTimesheet = todayTimesheetData?.todayTimesheet;

    useEffect(() => {
        if (activeEntry) {
            const interval = setInterval(() => {
                const start = new Date(activeEntry.startTime).getTime();
                const now = new Date().getTime();
                setElapsed(Math.floor((now - start) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [activeEntry]);

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

    const getAttendanceStatus = () => {
        if (!todayTimesheet) {
            return { status: 'Not Checked In', color: 'yellow', text: 'Pending' };
        }
        if (todayTimesheet.checkIn && !todayTimesheet.checkOut) {
            return { status: 'Checked In', color: 'green', text: 'Active' };
        }
        if (todayTimesheet.checkIn && todayTimesheet.checkOut) {
            return { status: 'Completed', color: 'blue', text: 'Done' };
        }
        return { status: 'Not Checked In', color: 'yellow', text: 'Pending' };
    };

    const attendanceStatus = getAttendanceStatus();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Time Tracker</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Track your working hours and task time
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Time Entry Card */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Active Timer
                    </h2>

                    {activeEntry ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
                                <ClockIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                {formatTime(elapsed)}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {activeEntry.description || 'Working...'}
                            </p>
                            <button
                                onClick={() => stopTimer()}
                                className="btn-primary px-8 py-3"
                            >
                                <StopIcon className="h-5 w-5 mr-2 inline" />
                                Stop Timer
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                                <ClockIcon className="h-12 w-12 text-gray-400" />
                            </div>
                            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                00:00:00
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                No active timer
                            </p>
                            <button
                                onClick={() => startTimer({ variables: { input: {} } })}
                                className="btn-primary px-8 py-3"
                            >
                                <PlayIcon className="h-5 w-5 mr-2 inline" />
                                Start Timer
                            </button>
                        </div>
                    )}
                </div>

                {/* Check-in/Check-out Card */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Daily Attendance
                    </h2>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Today's Status</p>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {attendanceStatus.status}
                                </span>
                                <span className={`px-3 py-1 text-sm rounded-full ${
                                    attendanceStatus.color === 'green' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        : attendanceStatus.color === 'blue'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                }`}>
                                    {attendanceStatus.text}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => checkIn()}
                                disabled={todayTimesheet?.checkIn && !todayTimesheet?.checkOut}
                                className={`btn-primary py-3 ${
                                    todayTimesheet?.checkIn && !todayTimesheet?.checkOut
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                }`}
                            >
                                Check In
                            </button>
                            <button
                                onClick={() => checkOut()}
                                disabled={!todayTimesheet?.checkIn || todayTimesheet?.checkOut}
                                className={`btn-secondary py-3 ${
                                    !todayTimesheet?.checkIn || todayTimesheet?.checkOut
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                }`}
                            >
                                Check Out
                            </button>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Check In</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {formatTimeFromDate(todayTimesheet?.checkIn)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Check Out</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {formatTimeFromDate(todayTimesheet?.checkOut)}
                                    </p>
                                </div>
                            </div>
                            {todayTimesheet?.totalHours && (
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {todayTimesheet.totalHours.toFixed(2)}h
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="card">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">0h 0m</p>
                </div>
                <div className="card">
                    <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">0h 0m</p>
                </div>
                <div className="card">
                    <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">0h 0m</p>
                </div>
            </div>
        </div>
    );
}
