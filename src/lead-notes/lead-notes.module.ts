import { Module } from '@nestjs/common';
import { LeadNotesService } from './lead-notes.service';
import { LeadNotesController } from './lead-notes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadNote } from './entities/lead-note.entity';
import { Customer } from '../customers/entity/customer.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
     TypeOrmModule.forFeature([
      LeadNote,
      Customer,
      User
     ])
  ],
  controllers: [LeadNotesController],
  providers: [LeadNotesService],
})
export class LeadNotesModule {}
