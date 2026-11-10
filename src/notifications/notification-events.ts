/** Eventos de tickets que pueden enviar correo. El valor se guarda en la base de datos. */
export enum NotificationEvent {
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  TICKET_STATUS_CHANGED = 'TICKET_STATUS_CHANGED',
  TICKET_CLOSED = 'TICKET_CLOSED',
}

export const NOTIFICATION_EVENT_INFO: Record<NotificationEvent, { label: string; description: string }> = {
  [NotificationEvent.TICKET_CREATED]: {
    label: 'Ticket creado',
    description: 'Cuando se levanta un ticket nuevo en la sucursal (app, portal público o plaza).',
  },
  [NotificationEvent.TICKET_ASSIGNED]: {
    label: 'Técnico asignado',
    description: 'Cuando se asigna o cambia el técnico de un ticket.',
  },
  [NotificationEvent.TICKET_STATUS_CHANGED]: {
    label: 'Cambio de estado',
    description: 'Cuando el ticket pasa a en proceso, en espera, en pausa u otro estado.',
  },
  [NotificationEvent.TICKET_CLOSED]: {
    label: 'Ticket cerrado',
    description: 'Cuando el ticket se resuelve y se cierra.',
  },
};

export const NOTIFICATION_EVENTS = Object.values(NotificationEvent);
