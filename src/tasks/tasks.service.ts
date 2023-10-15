import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { Task } from './task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, Repository } from 'typeorm';
import { TasksModule } from './tasks.module';
import { TaskStatus } from './task-status.enum';
import * as mongodb from 'mongodb';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TasksService {
    private logger = new Logger('TasksService');

    constructor(
        @InjectRepository(Task)
        private taskRepository: MongoRepository<Task>,
    ) {}

    async getTasks(
        filterDto: GetTasksFilterDto,
        user: User,
        ): Promise<Task[]> {
        const { status, search } = filterDto;

        // QueryBuilder is a way to build queries using a more object-oriented approach
        // However it is not supported by MongoDB :(
        // const query = this.taskRepository.createQueryBuilder('task');

        // if (status) {
        //     query.andWhere('task.status = :status', { status });
        // }

        // if (search) {
        //     query.andWhere('(task.title LIKE :search OR task.description LIKE :search)', { search: `%${search}%`}); // % is a wildcard to match anything before or after the search term (which makes search partial)
        // }

        // try {
        //     const tasks = await query.getMany();
        //     return tasks;
        // } catch(error) {
        //     this.logger.error(`Failed to get tasks for user "${user.username}. Filters: ${JSON.stringify(filterDto)}"`, error.stack);
        //     throw new InternalServerErrorException();
        // }

        // So we will use a more traditional approach
        const tasks = await this.taskRepository.find();

        // filter for the specific user.id for MongoDB
        const filteredTasks = tasks.filter(task => task.userId.equals(user.id));

        if (status) {
            return filteredTasks.filter(task => task.status === status);
        }

        if (search) {
            return filteredTasks.filter(task => task.title.includes(search) || task.description.includes(search));
        }

        return filteredTasks;
    }

    async getTaskById(
        id: string,
        user: User,
        ): Promise<Task> {
        const found = await this.taskRepository.findOneBy({ _id: new mongodb.ObjectId(id), userId: user.id });

        if (!found) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }

        return found;
    }

    async createTask(createTaskDto: CreateTaskDto,
        user: User,
        ): Promise<Task> {
        const {title, description} = createTaskDto;

        const task = new Task();
        task.title = title;
        task.description = description;
        task.status = TaskStatus.OPEN
        task.userId = user.id;

        try {
            await task.save();
        } catch(error) {
            this.logger.error(`Failed to create a task for user "${user.username}". Data: ${JSON.stringify(createTaskDto)}`, error.stack);
            throw new InternalServerErrorException();
        }

        return task;
    }


    async updateTaskStatus(id: string,
        status: TaskStatus,
        user: User
    ): Promise<Task> {
        const task = await this.getTaskById(id, user);
        task.status = status;

        await task.save();

        return task;
    }

    async deleteTask(
        id: string,
        user: User,
    ): Promise<void> {
        const result = await this.taskRepository.deleteOne({ _id: new mongodb.ObjectId(id), userId: user.id });

        if (result.deletedCount === 0) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }

        return;
    }
}
