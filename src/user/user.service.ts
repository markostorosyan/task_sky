import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserNotFoundExceptions } from './exceptions/user-not-found.exception';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const hashPassword = await bcrypt.hash(createUserDto.password, 10);

    const userEntity = this.userRepository.create({
      ...createUserDto,
      password: hashPassword,
    });

    await this.userRepository.save(userEntity);

    return userEntity;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const userEntity = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
    if (!userEntity) {
      throw new UserNotFoundExceptions();
    }
    return userEntity;
  }

  async findById(id: string): Promise<UserEntity> {
    const userEntity = this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOne();

    if (!userEntity) {
      throw new UserNotFoundExceptions();
    }

    return userEntity;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const userEntity = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOne();

    if (!userEntity) {
      throw new UserNotFoundExceptions();
    }

    this.userRepository.merge(userEntity, updateUserDto);

    await this.userRepository.save(userEntity);

    return userEntity;
  }

  async remove(id: string): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .where('id = :id', { id })
      .delete()
      .execute();
  }
}
