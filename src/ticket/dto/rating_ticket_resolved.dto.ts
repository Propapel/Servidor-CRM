import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class RateTicketDto {
  @IsInt()
  @Min(1)
  @Max(5)
  serviceRating: number;

  @IsString()
  @IsOptional()
  serviceComment?: string;
}