import { CreateInteractionDto } from "src/interation/dto/create-interation.dto";
import { CreateOpportunityDto } from "src/oportunity/dto/create-oportunity.dto";
import { CreatePurchaseDto } from "src/purchase/dto/create-purchase.dto";
import { CreateReminderDto } from "src/remider/dto/create-remider.dto";

export class CreateCustomerDto {
    readonly company_name: string;
    readonly contact_name: string;
    readonly email: string;
    readonly type_of_client: string;
    readonly phone_number: string;
    readonly address?: string;

    // Datos de CRM (opcionales)
    readonly job_title?: string;
    readonly lead_source?: string;
    readonly industry?: string;
    readonly company_size?: string;
    readonly website?: string;
    readonly rfc?: string;
    readonly city?: string;
    readonly estimated_value?: number;
    readonly expected_close_date?: string;
    readonly priority?: string;
    readonly tags?: string[];
    //Usuario
    readonly idUser: number;
    // Relacionar oportunidad (opcional)
    readonly opportunities?: CreateOpportunityDto[];
  
    // Relacionar interacciones (opcional)
    readonly interactions?: CreateInteractionDto[];
  
    // Relacionar compras (opcional)
    readonly purchases?: CreatePurchaseDto[];
  
    // Relacionar recordatorios (opcional)
    readonly reminders?: CreateReminderDto[];
  }
  