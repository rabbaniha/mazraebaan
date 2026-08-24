import { PartialType } from '@nestjs/mapped-types';
import { CreateCropTypeDto } from './create-crop-type.dto';

export class UpdateCropTypeDto extends PartialType(CreateCropTypeDto) {}
