import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimesheetsService {
    constructor(private prisma: PrismaService) { }

    async checkIn(employeeId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await this.prisma.timesheet.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
            },
        });

        if (existing && existing.checkIn) {
            throw new Error('Already checked in today');
        }

        return this.prisma.timesheet.upsert({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
            },
            update: {
                checkIn: new Date(),
            },
            create: {
                employeeId,
                date: today,
                checkIn: new Date(),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async checkOut(employeeId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const timesheet = await this.prisma.timesheet.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
            },
        });

        if (!timesheet || !timesheet.checkIn) {
            throw new Error('No check-in found for today');
        }

        if (timesheet.checkOut) {
            throw new Error('Already checked out today');
        }

        const checkOut = new Date();
        const totalHours =
            (checkOut.getTime() - timesheet.checkIn.getTime()) / (1000 * 60 * 60);

        return this.prisma.timesheet.update({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
            },
            data: {
                checkOut,
                totalHours: Number(totalHours.toFixed(2)),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async startTimeEntry(employeeId: string, taskId?: string, description?: string) {
        // Check if there's already an active time entry
        const activeEntry = await this.prisma.timeEntry.findFirst({
            where: {
                employeeId,
                endTime: null,
            },
        });

        if (activeEntry) {
            throw new Error('You already have an active timer running');
        }

        return this.prisma.timeEntry.create({
            data: {
                employeeId,
                taskId,
                description,
                startTime: new Date(),
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        project: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async stopTimeEntry(employeeId: string) {
        const activeEntry = await this.prisma.timeEntry.findFirst({
            where: {
                employeeId,
                endTime: null,
            },
        });

        if (!activeEntry) {
            throw new Error('No active timer found');
        }

        const endTime = new Date();
        const duration = Math.floor(
            (endTime.getTime() - activeEntry.startTime.getTime()) / (1000 * 60),
        );

        const updatedEntry = await this.prisma.timeEntry.update({
            where: { id: activeEntry.id },
            data: {
                endTime,
                duration,
            },
            include: {
                task: true,
            },
        });

        // Update task time spent if task is associated
        if (activeEntry.taskId) {
            await this.prisma.task.update({
                where: { id: activeEntry.taskId },
                data: {
                    timeSpent: {
                        increment: duration,
                    },
                },
            });
        }

        return updatedEntry;
    }

    async getTimesheets(employeeId?: string, startDate?: Date, endDate?: Date) {
        return this.prisma.timesheet.findMany({
            where: {
                ...(employeeId && { employeeId }),
                ...(startDate && endDate && {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                }),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: true,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        });
    }

    async getTimeEntries(employeeId?: string, taskId?: string) {
        return this.prisma.timeEntry.findMany({
            where: {
                ...(employeeId && { employeeId }),
                ...(taskId && { taskId }),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                        project: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                startTime: 'desc',
            },
        });
    }

    async getActiveTimeEntry(employeeId: string) {
        return this.prisma.timeEntry.findFirst({
            where: {
                employeeId,
                endTime: null,
            },
            include: {
                task: {
                    include: {
                        project: true,
                    },
                },
            },
        });
    }

    async getTodayTimesheet(employeeId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.prisma.timesheet.findFirst({
            where: {
                employeeId,
                date: today,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
}
