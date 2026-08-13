import { Controller, Get, UseGuards } from '@nestjs/common';
import { MeService } from './me.service';
import { AccessTokenGuard } from '../common/auth/access-token.guard';
import { CurrentUserId } from '../common/auth/current-user.decorator';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  /**
   * GET /me — the frontend asks the backend for the user's account state.
   * The backend NEVER redirects; it only returns state (Step 6).
   *
   * The access token is verified independently here (RS256 + public key), so
   * the user id comes from the cryptographic `sub` claim — never from a
   * client-supplied header.
   */
  @Get()
  @UseGuards(AccessTokenGuard)
  getMe(@CurrentUserId() userId: string) {
    return this.meService.getUserContext(userId);
  }
}
