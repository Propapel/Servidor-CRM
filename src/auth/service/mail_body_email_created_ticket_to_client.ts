const HTML_TICKET_CREATED_ALERT_TO_CLIENT = (
    nameClient,
    ticketId,
    dateCreated,
    tocketStatus
) => {
    return `
    <!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">

<head>
	<title></title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0"><!--[if mso]>
<xml><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"><w:DontUseAdvancedTypographyReadingMail/></w:WordDocument>
<o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml>
<![endif]--><!--[if !mso]><!--><!--<![endif]-->
	<style>
		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			padding: 0;
		}

		a[x-apple-data-detectors] {
			color: inherit !important;
			text-decoration: inherit !important;
		}

		#MessageViewBody a {
			color: inherit;
			text-decoration: none;
		}

		p {
			line-height: inherit
		}

		.desktop_hide,
		.desktop_hide table {
			mso-hide: all;
			display: none;
			max-height: 0px;
			overflow: hidden;
		}

		.image_block img+div {
			display: none;
		}

		sup,
		sub {
			font-size: 75%;
			line-height: 0;
		}

		@media (max-width:670px) {
			.desktop_hide table.icons-inner {
				display: inline-block !important;
			}

			.icons-inner {
				text-align: center;
			}

			.icons-inner td {
				margin: 0 auto;
			}

			.mobile_hide {
				display: none;
			}

			.row-content {
				width: 100% !important;
			}

			.stack .column {
				width: 100%;
				display: block;
			}

			.mobile_hide {
				min-height: 0;
				max-height: 0;
				max-width: 0;
				overflow: hidden;
				font-size: 0px;
			}

			.desktop_hide,
			.desktop_hide table {
				display: table !important;
				max-height: none !important;
			}
		}
	</style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
</head>

<body class="body" style="background-color: #3d1554; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
	<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #3d1554;">
		<tbody>
			<tr>
				<td>
					<table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #d38b00;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
													<div class="spacer_block block-1" style="height:20px;line-height:20px;font-size:1px;">&#8202;</div>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #d38b00;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
												<td class="column column-1" width="33.333333333333336%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
													<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div class="alignment" align="center">
																	<div style="max-width: 151.667px;"><a href="http://www.example.com/" target="_blank"><img src="https://bbecbbde2b.imgdist.com/pub/bfra/zigpwtii/i6a/nv1/gin/Propapel-logo%20%281%29.png" style="display: block; height: auto; border: 0; width: 100%;" width="151.667" alt="Logo" title="Logo" height="auto"></a></div>
																</div>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2" width="66.66666666666667%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
													<table class="empty_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<div></div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #d38b00;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
													<div class="spacer_block block-1" style="height:20px;line-height:20px;font-size:1px;">&#8202;</div>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #0017a0;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; border-left: 4px solid #0711e6; border-right: 4px solid #0711e6; padding-bottom: 60px; padding-top: 55px; vertical-align: top;">
													<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div class="alignment" align="center">
																	<div style="max-width: 128px;"><img src="https://bbecbbde2b.imgdist.com/pub/bfra/zigpwtii/phi/6bb/qbf/ChatGPT_Image_21_jul_2025__16_09_57-removebg-preview.png" style="display: block; height: auto; border: 0; width: 100%;" width="128" alt title height="auto"></div>
																</div>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad">
																<div style="color:#fbd711;font-family:'Poppins', Arial, Helvetica, sans-serif;font-size:30px;line-height:1.2;text-align:center;mso-line-height-alt:36px;">
																	<p style="margin: 0; word-break: break-word;"><strong><span style="word-break: break-word;">👋 ¡Hola ${nameClient}!,</span></strong></p>
																</div>
															</td>
														</tr>
													</table>
													<table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:10px;padding-left:50px;padding-right:50px;padding-top:10px;">
																<div style="font-family: sans-serif">
																	<div class style="font-size: 12px; font-family: 'Poppins', Arial, Helvetica, sans-serif; mso-line-height-alt: 14.399999999999999px; color: #ffffff; line-height: 1.2;">
																		<p style="margin: 0; font-size: 20px; text-align: center; mso-line-height-alt: 24px;"><span style="word-break: break-word; font-size: 24px;">Hemos recibido correctamente tu solicitud de soporte técnico.</span></p>
																		<p style="margin: 0; font-size: 20px; mso-line-height-alt: 14.399999999999999px;">&nbsp;</p>
																		<p style="margin: 0; font-size: 20px; mso-line-height-alt: 24px;"><span style="word-break: break-word; font-size: 20px;">📄 <strong>Número de ticket:</strong> <code> ${ticketId}</code>&nbsp;</span><br><span style="word-break: break-word; font-size: 20px;">📅 <strong>Fecha de creación:</strong> <code> ${dateCreated}</code>&nbsp;</span></p>
																		<p style="margin: 0; font-size: 20px; mso-line-height-alt: 24px;"><span style="word-break: break-word; font-size: 20px;">🔍 Si deseas consultar el estado de tu ticket, haz clic en el botón de abajo:</span></p>
																	</div>
																</div>
															</td>
														</tr>
													</table>
													<table class="button_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="padding-bottom:12px;padding-left:10px;padding-right:10px;padding-top:12px;text-align:center;">
																<div class="alignment" align="center"><a href="https://www.erppropapel.com/ticket/checkStatus/${tocketStatus}" target="_blank" style="color:#000000;text-decoration:none;"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="https://www.erppropapel.com/ticket/checkStatus/${tocketStatus}"  style="height:56px;width:186px;v-text-anchor:middle;" arcsize="54%" fillcolor="#fbd711">
<v:stroke dashstyle="Solid" weight="0px" color="#fbd711"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#000000;font-family:sans-serif;font-size:18px">
<![endif]--><span class="button" style="background-color: #fbd711; border-bottom: 0px solid transparent; border-left: 0px solid transparent; border-radius: 30px; border-right: 0px solid transparent; border-top: 0px solid transparent; color: #000000; display: inline-block; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 10px; padding-top: 10px; padding-left: 45px; padding-right: 45px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 36px;" data-mce-style><strong>Ver estatus</strong></span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-5" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:25px;padding-left:30px;padding-right:30px;padding-top:10px;">
																<div style="color:#ffffff;font-family:'Poppins', Arial, Helvetica, sans-serif;font-size:14px;line-height:1.5;text-align:center;mso-line-height-alt:21px;">
																	<p style="margin: 0; word-break: break-word;"><em>*📌 Recibirás notificaciones por este medio conforme avance la atención a tu solicitud.</em></p>
																</div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #0017a0;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #57366e; color: #000000; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
												<td class="column column-1" width="58.333333333333336%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #d38b00; padding-bottom: 55px; padding-left: 30px; padding-right: 30px; padding-top: 55px; vertical-align: middle;">
													<table class="text_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:20px;padding-left:25px;padding-right:25px;padding-top:10px;">
																<div style="font-family: sans-serif">
																	<div class style="font-size: 12px; font-family: 'Poppins', Arial, Helvetica, sans-serif; mso-line-height-alt: 18px; color: #ffffff; line-height: 1.5;">
																		<p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 21px;">¿Sabías que también vendemos impresoras, consumibles y productos de oficina?<br>👉 Descubre todo lo que tenemos para ti.</p>
																	</div>
																</div>
															</td>
														</tr>
													</table>
													<table class="button_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<div class="alignment" align="center"><a href="https://www.propapel.mx/index.php?route=information/information&information_id=24" target="_blank" style="color:#ffffff;text-decoration:none;"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="https://www.propapel.mx/index.php?route=information/information&information_id=24"  style="height:57px;width:230px;v-text-anchor:middle;" arcsize="48%" fillcolor="#00388c">
<v:stroke dashstyle="Solid" weight="2px" color="#795E8B"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#ffffff;font-family:sans-serif;font-size:18px">
<![endif]--><span class="button" style="background-color: #00388c; border-bottom: 2px solid #795E8B; border-left: 2px solid #795E8B; border-radius: 30px; border-right: 2px solid #795E8B; border-top: 2px solid #795E8B; color: #ffffff; display: inline-block; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 18px; padding-top: 18px; padding-left: 60px; padding-right: 60px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 21.599999999999998px;" data-mce-style>&nbsp; Impresoras&nbsp;&nbsp;</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
															</td>
														</tr>
													</table>
													<table class="button_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<div class="alignment" align="center"><a href="https://www.propapel.mx/" target="_blank" style="color:#ffffff;text-decoration:none;"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="https://www.propapel.mx/"  style="height:57px;width:233px;v-text-anchor:middle;" arcsize="48%" fillcolor="#00388c">
<v:stroke dashstyle="Solid" weight="2px" color="#795E8B"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#ffffff;font-family:sans-serif;font-size:18px">
<![endif]--><span class="button" style="background-color: #00388c; border-bottom: 2px solid #795E8B; border-left: 2px solid #795E8B; border-radius: 30px; border-right: 2px solid #795E8B; border-top: 2px solid #795E8B; color: #ffffff; display: inline-block; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 18px; padding-top: 18px; padding-left: 35px; padding-right: 35px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 21.599999999999998px;" data-mce-style>&nbsp; &nbsp; Otros productos&nbsp; &nbsp;</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
															</td>
														</tr>
													</table>
													<table class="button_block block-4" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<div class="alignment" align="center"><a href="http://www.example.com/" target="_blank" style="color:#ffffff;text-decoration:none;"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="http://www.example.com/"  style="height:57px;width:229px;v-text-anchor:middle;" arcsize="48%" fillcolor="#00388c">
<v:stroke dashstyle="Solid" weight="2px" color="#795E8B"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#ffffff;font-family:sans-serif;font-size:18px">
<![endif]--><span class="button" style="background-color: #00388c; border-bottom: 2px solid #795E8B; border-left: 2px solid #795E8B; border-radius: 30px; border-right: 2px solid #795E8B; border-top: 2px solid #795E8B; color: #ffffff; display: inline-block; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 18px; padding-top: 18px; padding-left: 60px; padding-right: 60px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 21.599999999999998px;" data-mce-style>Cookie Policy</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-5" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:10px;padding-left:25px;padding-right:25px;padding-top:20px;">
																<div style="color:#ffffff;font-family:'Poppins', Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;text-align:center;mso-line-height-alt:24px;">
																	<p style="margin: 0; word-break: break-word;">Si tienes alguna duda, no dudes en <a href="mailto:ventassai@propapel.com.mx" target="_blank" title="ventassai@propapel.com.mx" style="text-decoration: underline; color: #ffffff;" rel="noopener">contactarnos</a>. Estamos para ayudarte.</p>
																</div>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2" width="41.666666666666664%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #d38b00; padding-bottom: 5px; padding-top: 5px; vertical-align: middle;">
													<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div class="alignment" align="center">
																	<div style="max-width: 270.833px;"><img src="https://bbecbbde2b.imgdist.com/pub/bfra/zigpwtii/zik/fdi/hdb/ChatGPT_Image_21_jul_2025__13_01_18-removebg-preview.png" style="display: block; height: auto; border: 0; width: 100%;" width="270.833" alt title height="auto"></div>
																</div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-6" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #0017a0;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
													<table class="paragraph_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:20px;padding-left:10px;padding-right:10px;padding-top:15px;">
																<div style="color:#b0a7b7;font-family:'Poppins', Arial, Helvetica, sans-serif;font-size:12px;line-height:1.5;text-align:center;mso-line-height-alt:18px;">
																	<p style="margin: 0;">ServiceDesk | Departamento de SAI | Área de Soporte Técnico. <br>© Propapel 2025. Todos los derechos reservados.</p>
																</div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-7" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; background-color: #ffffff; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
													<table class="icons_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: center; line-height: 0;">
														<tr>
															<td class="pad" style="vertical-align: middle; color: #1e0e4b; font-family: 'Inter', sans-serif; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;"><!--[if vml]><table align="center" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
																<!--[if !vml]><!-->
																<table class="icons-inner" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; padding-left: 0px; padding-right: 0px;" cellpadding="0" cellspacing="0" role="presentation"><!--<![endif]-->
																	<tr>
																		<td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 6px;"><a href="http://designedwithbeefree.com/" target="_blank" style="text-decoration: none;"><img class="icon" alt="Beefree Logo" src="https://d1oco4z2z1fhwp.cloudfront.net/assets/Beefree-logo.png" height="auto" width="34" align="center" style="display: block; height: auto; margin: 0 auto; border: 0;"></a></td>
																		<td style="font-family: 'Inter', sans-serif; font-size: 15px; font-weight: undefined; color: #1e0e4b; vertical-align: middle; letter-spacing: undefined; text-align: center; line-height: normal;"><a href="http://designedwithbeefree.com/" target="_blank" style="color: #1e0e4b; text-decoration: none;">Designed with Beefree</a></td>
																	</tr>
																</table>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
		</tbody>
	</table><!-- End -->
</body>

</html>
    `;
};

export default  HTML_TICKET_CREATED_ALERT_TO_CLIENT;
