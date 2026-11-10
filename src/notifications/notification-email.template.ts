/** Plantilla HTML única para los correos de tickets (compatible con Outlook/Gmail: tablas y estilos en línea). */
export interface TicketEmailData {
  title: string;
  intro: string;
  ticketNumber: string;
  rows: [string, string | null | undefined][];
  actionUrl?: string | null;
  actionLabel?: string;
  branchName?: string | null;
}

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderTicketEmail(d: TicketEmailData): string {
  const rows = d.rows
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;color:#5f6368;font-size:13px;width:160px;vertical-align:top;border-bottom:1px solid #eef1f5">${esc(label)}</td>
          <td style="padding:8px 12px;color:#1f1f1f;font-size:14px;border-bottom:1px solid #eef1f5">${esc(String(value)).replace(/\n/g, '<br>')}</td>
        </tr>`,
    )
    .join('');
  const action = d.actionUrl
    ? `<tr><td style="padding:24px 0 8px" align="center">
         <a href="${esc(d.actionUrl)}" style="background:#003f87;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:24px;font-size:14px;font-weight:bold;display:inline-block">${esc(d.actionLabel ?? 'Ver ticket')}</a>
       </td></tr>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;padding:24px 0"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#003f87;padding:20px 24px;color:#ffffff">
        <div style="font-size:12px;letter-spacing:1px;opacity:.85">MESA DE AYUDA${d.branchName ? ' · ' + esc(d.branchName.toUpperCase()) : ''}</div>
        <div style="font-size:22px;font-weight:bold;margin-top:4px">${esc(d.title)}</div>
        <div style="font-size:14px;margin-top:2px;opacity:.9">Ticket #${esc(d.ticketNumber)}</div>
      </td></tr>
      <tr><td style="padding:20px 24px 4px;color:#1f1f1f;font-size:14px;line-height:1.5">${esc(d.intro)}</td></tr>
      <tr><td style="padding:8px 12px"><table width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
      ${action}
      <tr><td style="padding:16px 24px 24px;color:#80868b;font-size:12px;line-height:1.4">
        Este es un aviso automático del sistema de mesa de ayuda de Propapel. No respondas a este correo si no tienes un correo de respuesta configurado.
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}
