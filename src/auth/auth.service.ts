import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

//npm i bcryptjs
import * as bcryptjs from 'bcryptjs'; //npm i --save-dev @types/bcryptjs

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {

      const { password, ...userData } = createUserDto; 

      const newUser = new this.userModel({
        password: await bcryptjs.hash(password, 10),
        ...userData,
      });

      await newUser.save();

      const { password:_, ...result } = newUser.toJSON();

      return result;

    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`${ createUserDto.email } is already taken`);
      }

      throw  new InternalServerErrorException('Something went wrong');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email: email });

    if (!user) {
      throw new UnauthorizedException('Not valid credentials - email');
    }

    const isPasswordValid = bcryptjs.compareSync(password, user.password);  

    if (!isPasswordValid) {
      throw new UnauthorizedException('Not valid credentials - password');
    }

    const { password:_, ...result } = user.toJSON();

    return { 
      user: result,
      token: 'fake-jwt-token',
     };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
