import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env file

const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'mongodb',
    url: process.env.MONGO_URI,
    synchronize: true,
    useUnifiedTopology: true,
    entities: [__dirname + '/../**/*.entity.{js,ts}']
};

export default typeOrmConfig;