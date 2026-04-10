import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './entities/user.entity';
import { ApiTags, ApiResponse, ApiQuery, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('user')
export class UserController {

    constructor(private readonly userService: UserService){}


    @Post()
    @ApiOperation({ summary: 'Create user' })
    @ApiResponse({ status: 201 })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @HttpCode(HttpStatus.CREATED)
    create(@Body() userDto: CreateUserDto){
        return this.userService.create(userDto);
    }

    @Get()
    @HttpCode(200)
    findAll(): User[] {
        return this.userService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by id' })
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @HttpCode(200)
    findOne(@Param('id', ParseUUIDPipe) id: string){
        return this.userService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update user password' })
    @ApiResponse({ status: 200, description: 'Password updated successfully' })
    @ApiResponse({ status: 403, description: 'Wrong old password' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @HttpCode(200)
    updatePassword(@Param('id', ParseUUIDPipe) id: string, @Body() updatePasswordDto: UpdatePasswordDto){
        return this.userService.updatePassword(id, updatePasswordDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete user' })
    @ApiResponse({ status: 204, description: 'User deleted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseUUIDPipe) id: string){
        return this.userService.remove(id);
    }
}
