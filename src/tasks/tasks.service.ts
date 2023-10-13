import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { Task } from './task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, Repository } from 'typeorm';
import { TasksModule } from './tasks.module';
import { TaskStatus } from './task-status.enum';
import * as mongodb from 'mongodb';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: MongoRepository<Task>,
    ) {}

    async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
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

        // const tasks = await query.getMany();
        // return tasks;

        // So we will use a more traditional approach
        const tasks = await this.taskRepository.find();

        if (status) {
            return tasks.filter(task => task.status === status);
        }

        if (search) {
            return tasks.filter(task => task.title.includes(search) || task.description.includes(search));
        }

        return tasks;
    }

    async getTaskById(id: string): Promise<Task> {
        const found = await this.taskRepository.findOneBy({ _id: new mongodb.ObjectId(id)});

        if (!found) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }

        return found;
    }

    async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
        const {title, description} = createTaskDto;

        const task = new Task();
        task.title = title;
        task.description = description;
        task.status = TaskStatus.OPEN

        await task.save();
        
        return task;
    }


    async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
        const task = await this.getTaskById(id);
        task.status = status;

        await task.save();

        return task;
    }

    async deleteTask(id: string): Promise<void> {
        const result = await this.taskRepository.deleteOne({ _id: new mongodb.ObjectId(id)});

        if (result.deletedCount === 0) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }

        return;
    }
}
