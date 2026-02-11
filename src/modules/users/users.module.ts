import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { SharedModule } from '../shared/shared.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  imports: [SharedModule],
  exports: [UsersService],
})
export class UsersModule {}
