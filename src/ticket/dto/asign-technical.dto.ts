import { Type } from "class-transformer";
import { IsArray } from "class-validator";

export class AsignTechnicalDto {
    @IsArray()
    @Type(() => Number)
    assigmentsTechnical: number[];
}