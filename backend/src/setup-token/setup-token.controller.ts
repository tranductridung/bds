import { Controller } from '@nestjs/common';
import { SetupTokenService } from './setup-token.service';

@Controller('setup-token')
export class SetupTokenController {
  constructor(private readonly setupTokenService: SetupTokenService) {}
}
