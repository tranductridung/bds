import { Module } from '@nestjs/common';
import { SetupTokenService } from './setup-token.service';
import { SetupTokenController } from './setup-token.controller';

@Module({
  controllers: [SetupTokenController],
  providers: [SetupTokenService],
})
export class SetupTokenModule {}
