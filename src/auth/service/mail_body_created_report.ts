const HTML_CREATED_REPORT = (
  userCreatedReport,
  id,
  fecha,
  ubicacion,
  descripcion,
) => {
  return `
   <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Confirmación de Ticket - Propapel</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      font-family: "Segoe UI", Tahoma, sans-serif;
      background-color: #f0f2f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 700px;
      margin: auto;
      background-color: #ffffff;
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
      background-color: #e3f2fd;
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
      <p>Te confirmamos que hemos recibido correctamente tu solicitud de soporte técnico.</p>

      <div class="info-box">
        <p><span class="label">Número de ticket:</span> <a href="#">#${id}</a></p>
        <p><span class="label">Fecha de solicitud:</span> ${fecha}</p>
        <p><span class="label">Ubicación:</span> ${ubicacion}</p>
      </div>

      <div class="section">
        <p><strong>Descripción del problema:</strong></p>
        <p>${descripcion}</p>
      </div>

      <p>Un técnico de nuestro equipo atenderá el caso a la brevedad y se comunicará contigo si requiere información adicional.</p>

      <p>Gracias por tu confianza.</p>

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

export default HTML_CREATED_REPORT;
