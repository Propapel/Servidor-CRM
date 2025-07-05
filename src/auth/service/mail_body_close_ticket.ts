const HTML_TECHNICAL_CLOSE_TICKET = (
  userCreatedReport,
  id,
  fecha,
  ubicacion,
  descripcion,
  nombreTecnico,
  fechaResolve,
  dias,
  ratingToken
) => {
  return `
 <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket Resuelto - Propapel</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      font-family: "Segoe UI", Tahoma, sans-serif;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 700px;
      margin: auto;
      padding: 20px;
      border-radius: 4px;
    }
    .header {
      background-color: #0d47a1;
      color: #ffffff;
      text-align: center;
      padding: 12px;
      font-size: 20px;
      font-weight: bold;
    }
    .section {
      margin-top: 20px;
    }
    .info-box {
      border-left: 4px solid #1565c0;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 6px 0;
      font-size: 14px;
    }
    .label {
      font-weight: bold;
      color: #0d47a1;
    }
    .content p {
      font-size: 14px;
      margin: 8px 0;
    }
    .button-container {
      text-align: center;
      margin-top: 20px;
    }
    .rate-button {
      display: inline-block;
      background-color: #0d47a1;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 14px;
    }
    .rate-button:hover {
      background-color: #1565c0;
    }
    .footer {
      font-size: 11px;
      color: #777777;
      text-align: center;
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #cccccc;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Soporte Técnico – Propapel</div>

    <div class="content">
      <p>Hola <strong>${userCreatedReport}</strong>,</p>
      <p>Queremos informarte que tu ticket ha sido <strong>resuelto</strong> correctamente.</p>

      <div class="info-box">
        <p><span class="label">Número de ticket:</span> <a href="#">#${id}</a></p>
        <p><span class="label">Fecha de solicitud:</span> ${fecha}</p>
        <p><span class="label">Fecha de resolución:</span> ${fechaResolve}</p>
        <p><span class="label">Tiempo de resolución:</span> ${dias} días</p>
        <p><span class="label">Técnico asignado:</span> ${nombreTecnico}</p>
        <p><span class="label">Ubicación:</span> ${ubicacion}</p>
      </div>

      <div class="section">
        <p><strong>Descripción del problema:</strong></p>
        <p>${descripcion}</p>
      </div>

      <p>Puedes consultar el reporte generado en tu aplicación de CRM, en el apartado de <strong>Reportes</strong>.</p>

      <div class="button-container">
        <a href="http://172.17.1.31:3000/ticket/qualifyTicket?token=${ratingToken}" class="rate-button">Califica el servicio</a>
      </div>

      <p>Gracias por utilizar nuestro sistema de soporte.</p>

      <p>Saludos cordiales,</p>
      <p><strong>Equipo de Soporte Técnico</strong><br>Propapel</p>
    </div>

    <div class="footer">
      Este correo fue generado automáticamente. Si tienes dudas, contáctanos desde nuestra plataforma de soporte.<br><br>
      ServiceDesk | Departamento de SAI | Área de Soporte Técnico.<br>
      © Propapel 2025. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>


      `;
};

export default HTML_TECHNICAL_CLOSE_TICKET;
