import { InputType, Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';
import { TimesheetStatus } from '@prisma/client';

registerEnumType(TimesheetStatus, { name: 'TimesheetStatus' });

@InputType()
export class StartTimeEntryInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    taskId?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;
}

@ObjectType()
export class TimesheetType {
    @Field()
    id: string;

    @Field()
    employeeId: string;

    @Field()
    date: Date;

    @Field({ nullable: true })
    checkIn?: Date;

    @Field({ nullable: true })
    checkOut?: Date;

    @Field()
    totalHours: number;

    @Field(() => TimesheetStatus)
    status: TimesheetStatus;

    @Field({ nullable: true })
    notes?: string;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}

@ObjectType()
export class TimeEntryType {
    @Field()
    id: string;

    @Field()
    employeeId: string;

    @Field({ nullable: true })
    taskId?: string;

    @Field()
    startTime: Date;

    @Field({ nullable: true })
    endTime?: Date;

    @Field()
    duration: number;

    @Field({ nullable: true })
    description?: string;

    @Field()
    isManual: boolean;

    @Field()
    createdAt: Date;
}
