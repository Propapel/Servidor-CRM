import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PageQueryDto } from '../../common/pagination/page-query.dto';

/** GET /ticket/page?branchId=1&page=1&limit=25&search=&status=A,B&typeOfReport=&attentionType= */
export class TicketPageQueryDto extends PageQueryDto {
  /** Sin branchId devuelve todas las sucursales. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branchId?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  typeOfReport?: string;

  @IsOptional()
  @IsString()
  attentionType?: string;
}
