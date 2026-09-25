import { IsString, Length, MaxLength } from "class-validator";

export class ChatDto {
  @IsString()
  @MaxLength(1000)
  message!: string;
}

export class ExecuteDto {
  @IsString()
  @Length(6, 6)
  authCode!: string;
}

export class CategoryDto {
  @IsString()
  @MaxLength(20)
  category!: string;
}
