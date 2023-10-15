import { ConflictException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt/dist';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
    private logger = new Logger('AuthService');

    constructor(
        @InjectRepository(User)
        private userRepository: MongoRepository<User>,
        private jwtService: JwtService,
    ) {}


    async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
        const { username, password } = authCredentialsDto;

        const user = new User();
        user.username = username;
        user.salt = await bcrypt.genSalt();
        user.password = await this.hashPassword(password, user.salt);

        // Catch the error if the username already exists
        try {
            await user.save();
        } catch (error) {
            if (error.code === 11000) { // duplicate username
                throw new ConflictException('Username already exists');
            }
            else {
                throw new InternalServerErrorException();
            }
        }
    }

    async signIn(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
        const username = await this.validateUserPassword(authCredentialsDto);

        if (!username) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        const payload: JwtPayload = { username }; // payload is the data that will be stored in the JWT token
        const accessToken = await this.jwtService.sign(payload);

        this.logger.debug(`Generated JWT Token with payload ${JSON.stringify(payload)}`);

        return { accessToken };
    }

    async validateUserPassword(authCredentialsDto: AuthCredentialsDto): Promise<string> {
        const {username, password} = authCredentialsDto;
        const user = await this.userRepository.findOneBy({username: username})

        if (user && await user.validatePassword(password)){
            return user.username;
        }
        return null;
    }

    private async hashPassword(password:string, salt: string): Promise<string> {
        return bcrypt.hash(password, salt);
    }
}
