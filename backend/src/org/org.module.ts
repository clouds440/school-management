import { Module } from '@nestjs/common';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { FilesModule } from '../files/files.module';

@Module({
    imports: [FilesModule],
    controllers: [OrgController],
    providers: [OrgService],
})
export class OrgModule { }
