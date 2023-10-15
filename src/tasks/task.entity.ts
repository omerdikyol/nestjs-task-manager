import { BaseEntity, Column, Entity, ManyToOne, ObjectIdColumn} from "typeorm";
import { TaskStatus } from "./task-status.enum";
import { ObjectId } from "mongodb";
import { User } from "src/auth/user.entity";

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

    @Column()
    userId: ObjectId;
}