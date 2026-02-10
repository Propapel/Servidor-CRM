
export class AddCommentTicketDto {
    ticketId: number;
    userId: number;
    comment: string;
    imageUrl?: string; // Optional field for image URL,
    isInternal: boolean
}

