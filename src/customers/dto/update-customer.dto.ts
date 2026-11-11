export class UpdateCustomerDto{
    company_name: string;
    contact_name: string;
    email: string;
    type_of_client: string;
    phone_number: string;
    address?: string;

    // Datos de CRM (opcionales)
    job_title?: string;
    lead_source?: string;
    industry?: string;
    company_size?: string;
    website?: string;
    rfc?: string;
    city?: string;
    estimated_value?: number;
    expected_close_date?: string;
    priority?: string;
    tags?: string[];
}