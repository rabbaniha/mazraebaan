import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthIdentitiesService } from './auth-identities.service';
import { CreateAuthIdentityDto } from './dto/create-auth-identity.dto';
import { UpdateAuthIdentityDto } from './dto/update-auth-identity.dto';

@Controller('auth-identities')
export class AuthIdentitiesController {
  constructor(private readonly authIdentitiesService: AuthIdentitiesService) {}

  @Post()
  create(@Body() dto: CreateAuthIdentityDto) {
    return this.authIdentitiesService.createForUser(
      dto.userId,
      dto.providerType,
      dto.providerSubject,
      {
        emailNormalized: dto.emailNormalized,
        phoneE164: dto.phoneE164,
        credentialHash: dto.credentialHash,
        isPrimary: dto.isPrimary,
        metadata: dto.metadata,
      },
    );
  }

  @Get()
  findAll() {
    return this.authIdentitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authIdentitiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAuthIdentityDto: UpdateAuthIdentityDto,
  ) {
    return this.authIdentitiesService.update(id, updateAuthIdentityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authIdentitiesService.remove(id);
  }
}
