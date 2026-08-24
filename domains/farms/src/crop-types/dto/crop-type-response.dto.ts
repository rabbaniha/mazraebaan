export class CropTypeResponseDto {
  id!: string;
  code!: string;
  name_fa!: string;
  name_en!: string;
  scientific_name!: string | null;
  category!: string | null;
  is_active!: boolean;
}
