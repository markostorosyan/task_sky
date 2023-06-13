import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const userExist = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (userExist) {
      throw new BadRequestException({
        message: `Email already in use`,
      });
    }
    const user: UserEntity = new UserEntity();
    user.firstname = createUserDto.firstname;
    user.lastname = createUserDto.lastname;
    user.phone = createUserDto.phone;
    user.email = createUserDto.email;
    user.password = await bcrypt.hash(createUserDto.password, 10);

    return this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException({
        message: `User whit email: ${email} not found`,
      });
    }
    return user;
  }

  findOne(id) {
    return this.userRepository.findOne({ where: { id } });
  }

  async updatePassword(id: number, password: string) {
    const user = await this.findOne(id);

    user.password = await bcrypt.hash(password, 10);

    this.userRepository.save(user);
  }

  async getInfo(id: number) {
    const user = await this.findOne(id);

    if (!user) {
      throw new ForbiddenException({
        message: `User whit id: ${id} not found`,
      });
    }

    const { password, ...result } = user;

    return result;
  }

  async update(userId, updateUserDto: UpdateUserDto) {
    const userEntity = await this.findOne(userId);

    if (!userEntity) {
      throw new ForbiddenException({
        message: `User whit id: ${userId} not found`,
      });
    }

    if (updateUserDto.hasOwnProperty('firstname')) {
      userEntity.firstname = updateUserDto.firstname;
    }
    if (updateUserDto.hasOwnProperty('lastname')) {
      userEntity.lastname = updateUserDto.lastname;
    }
    if (updateUserDto.hasOwnProperty('phone')) {
      userEntity.phone = updateUserDto.phone;
    }
    if (updateUserDto.hasOwnProperty('email')) {
      userEntity.email = updateUserDto.email;
    }

    return this.userRepository.save(userEntity);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }
}
