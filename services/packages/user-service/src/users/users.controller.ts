// NOTE: There may be TypeScript compilation errors related to the 'effect' library
// which is a dependency of Prisma. These errors are not related to our code
// and can be ignored. The application should still run despite these errors.
// The effect library has compatibility issues with certain TypeScript versions.

import { Controller, Get, Put, Body, UseGuards, Request, Post, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation,ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
 @Post('create-account')
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createAccount(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

 
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.user_id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.user_id, updateUserDto);
  }

  // NEW: Get user by ID (for API Gateway)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // NEW: Get user by email (for API Gateway)
  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    const { password_hash: _, ...result } = user;
    return result;
  }

  // NEW: Get user preferences (for API Gateway)
  @Get(':id/preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPreferences(@Param('id') id: string) {
    return this.usersService.getUserPreferences(id);
  }
}

