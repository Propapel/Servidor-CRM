import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
    `;
  }
  getDates(): string {
    return `
   <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Participación en Citas</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f7f9fc;
      padding: 20px;
    }

    h2 {
      background-color: #007BFF;
      color: white;
      padding: 15px;
      text-align: center;
      border-radius: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background-color: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      background-color: #0056b3;
      color: white;
    }

    tr:nth-child(even) {
      background-color: #f2f2f2;
    }

    tfoot td {
      font-weight: bold;
      background-color: #e9ecef;
    }
  </style>
</head>
<body>

  <h2>PARTICIPACIÓN EN CITAS CLIENTE NUEVO, CRECIMIENTO O RECUPERADO 2025</h2>

  <table>
    <thead>
      <tr>
        <th>CLAVE</th>
        <th>VENDEDOR</th>
        <th>ASISTIDAS / MARZO 2025</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>P000</td><td>Danya Koh</td><td>1</td></tr>
      <tr><td>P000</td><td>Carlos Sanchez</td><td>2</td></tr>
      <tr><td>P065</td><td>Josefina</td><td>17</td></tr>
      <tr><td>359</td><td>Geny H.</td><td>1</td></tr>
      <tr><td>P419</td><td>Noe Torres</td><td>2</td></tr>
      <tr><td>P471</td><td>Tere Gamboa</td><td>1</td></tr>
      <tr><td>P501</td><td>Yolanda Bacab</td><td>15</td></tr>
      <tr><td>520</td><td>520 Selene Gonzales</td><td>5</td></tr>
      <tr><td>P595</td><td>Estela</td><td>5</td></tr>
      <tr><td>P52</td><td>Karla Vazquez</td><td>2</td></tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Total</td>
        <td>51</td>
      </tr>
    </tfoot>
  </table>

</body>
</html>
  `;
  }
}
