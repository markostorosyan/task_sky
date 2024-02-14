import { Module } from '@nestjs/common';
import { SkyModule } from './sky/sky.module';

@Module({
  imports: [SkyModule],
})
export class AppModule {}
