import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as bcryptjs from 'bcryptjs'; //npm i bcryptjs //npm i --save-dev @types/bcryptjs
import { JwtService } from '@nestjs/jwt'; //npm install --save @nestjs/jwt
import { JwtPayload } from './interfaces/jwtPayload';

import { User } from './entities/user.entity';
import { LoginResponse } from '../../dist/auth/interfaces/login-response';
import { CreateUserDto, UpdateUserDto, LoginDto, RegisterUserDto } from './dto';


@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
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

  async register(registerUserDto: RegisterUserDto): Promise<LoginResponse> {

    const newUser = new CreateUserDto();
    newUser.email = registerUserDto.email;
    newUser.name = registerUserDto.name;
    newUser.password = registerUserDto.password;
    newUser.roles = ['user'];

    const createdUser = await this.create(newUser);
    return this.login({ email: createdUser.email, password: createdUser.password });
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {

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
      token: this.generateJwtToken({ id: user.id }),
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

  private generateJwtToken(payload: JwtPayload) { 
    const token = this.jwtService.sign(payload);   
    return token;
  }
}
