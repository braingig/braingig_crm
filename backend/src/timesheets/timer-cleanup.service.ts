import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimerCleanupService {
    private readonly logger = new Logger(TimerCleanupService.name);

    constructor(private prisma: PrismaService) {}

    // Run every 5 minutes to clean up abandoned timers
    @Cron('*/5 * * * *')
    async cleanupAbandonedTimers() {
        try {
            // Find all active time entries (entries without end time)
            const activeEntries = await (this.prisma as any).timeEntry.findMany({
                where: {
                    endTime: null,
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

            const now = new Date();
            const abandonedThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds

            for (const entry of activeEntries) {
                const startTime = new Date(entry.startTime);
                const timeSinceStart = now.getTime() - startTime.getTime();

                // If timer has been running for more than 30 minutes without activity,
                // consider it abandoned and stop it
                if (timeSinceStart > abandonedThreshold) {
                    const duration = Math.floor(timeSinceStart / (1000 * 60)); // Convert to minutes

                    await (this.prisma as any).timeEntry.update({
                        where: { id: entry.id },
                        data: {
                            endTime: now,
                            duration,
                        },
                    });

                    // Update task time spent if task is associated
                    if (entry.taskId) {
                        await (this.prisma as any).task.update({
                            where: { id: entry.taskId },
                            data: {
                                timeSpent: {
                                    increment: duration,
                                },
                            },
                        });
                    }

                    this.logger.log(
                        `Auto-stopped abandoned timer for employee ${entry.employee.name} (${entry.employee.email}). Duration: ${duration} minutes`
                    );
                }
            }
        } catch (error) {
            this.logger.error('Error during timer cleanup:', error);
        }
    }

    // Run every hour to check for very long-running timers (more than 12 hours)
    @Cron('0 * * * *')
    async cleanupVeryLongTimers() {
        try {
            const activeEntries = await (this.prisma as any).timeEntry.findMany({
                where: {
                    endTime: null,
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

            const now = new Date();
            const longThreshold = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

            for (const entry of activeEntries) {
                const startTime = new Date(entry.startTime);
                const timeSinceStart = now.getTime() - startTime.getTime();

                // If timer has been running for more than 12 hours, stop it
                if (timeSinceStart > longThreshold) {
                    const duration = Math.floor(timeSinceStart / (1000 * 60)); // Convert to minutes

                    await (this.prisma as any).timeEntry.update({
                        where: { id: entry.id },
                        data: {
                            endTime: now,
                            duration,
                        },
                    });

                    // Update task time spent if task is associated
                    if (entry.taskId) {
                        await (this.prisma as any).task.update({
                            where: { id: entry.taskId },
                            data: {
                                timeSpent: {
                                    increment: duration,
                                },
                            },
                        });
                    }

                    this.logger.warn(
                        `Auto-stopped very long timer for employee ${entry.employee.name} (${entry.employee.email}). Duration: ${Math.floor(duration / 60)} hours ${duration % 60} minutes`
                    );
                }
            }
        } catch (error) {
            this.logger.error('Error during long timer cleanup:', error);
        }
    }
}