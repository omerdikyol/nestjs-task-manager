import { BaseEntity, Column, Entity, ObjectIdColumn} from "typeorm";
import { TaskStatus } from "./task-status.enum";
import { ObjectId } from "mongodb";

@Entity()
export class Task extends BaseEntity {
    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    status: TaskStatus;
}