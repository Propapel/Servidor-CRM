export class CreateProductDto {
    branchId: number;
    name: string; // Ej: "Office 365", "Kaspersky"
    vendor: string; // Microsoft, Kaspersky, etc.
}