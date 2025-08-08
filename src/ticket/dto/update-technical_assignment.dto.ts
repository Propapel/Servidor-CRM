import { PartialType } from "@nestjs/mapped-types";
import { AsignTechnicalDto } from "./asign-technical.dto";

export class UpdateTechnicalAssignment extends PartialType(AsignTechnicalDto) {}