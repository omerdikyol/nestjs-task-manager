import { ObjectId } from "mongodb";
import { BaseEntity, Column, Entity, ObjectIdColumn, OneToMany, Unique } from "typeorm";
import * as bcrypt from 'bcrypt';
import { Task } from "src/tasks/task.entity";

@Entity()
@Unique(['username']) // this is a constraint in the database that ensures that the username is unique
export class User extends BaseEntity {
    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column()
    salt: string;

    @OneToMany(type => Task, task => task.userId, { eager: true })
    tasks: Task[];

    async validatePassword(password: string): Promise<boolean> {
        const hash = await bcrypt.hash(password, this.salt);
        return hash === this.password;
    }
}