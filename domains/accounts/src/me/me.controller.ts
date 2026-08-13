import { Controller, Get, Headers } from '@nestjs/common';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  /**
   * GET /me — the frontend asks the backend for the user's account state.
   * The backend NEVER redirects; it only returns state (Step 6).
   *
   * TODO: replace the `x-user-id` header with the JWT `sub` claim forwarded by
   * the api-gateway once JWT auth middleware is implemented.
   */
  @Get()
  getMe(@Headers('x-user-id') userId?: string) {
    return this.meService.getUserContext(userId ?? '');
  }
}
