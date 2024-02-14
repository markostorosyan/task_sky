import { Module, forwardRef } from '@nestjs/common';
import { SkyController } from './sky.controller';
import { SkyService } from './sky.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [forwardRef(() => HttpModule)],
  controllers: [SkyController],
  providers: [SkyService],
})
export class SkyModule {}
