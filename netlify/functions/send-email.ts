import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido. Utilize POST.' }),
    };
  }

  let body: { to_email?: string; subject?: string; message?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Body inválido. Envie um JSON válido.' }),
    };
  }

  const { to_email, subject, message } = body;

  if (!to_email || !subject || !message) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Parâmetros em falta: to_email, subject, message são obrigatórios.' }),
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'A chave RESEND_API_KEY não está configurada no ambiente do servidor.' }),
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Priorize <onboarding@resend.dev>',
        to: [to_email],
        subject: subject,
        text: message,
        html: `<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em;">Priorize</h1>
          </div>
          <div style="padding: 24px 16px;">
            <h3 style="margin-top: 0; color: #1e293b; font-size: 16px;">Olá,</h3>
            <p style="white-space: pre-wrap; font-size: 14px; color: #475569;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
            Este é um e-mail automático enviado pelo seu aplicativo Priorize.
          </div>
        </div>`,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data }),
      };
    } else {
      const errorText = await res.text();
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Erro na API do Resend: ${errorText}` }),
      };
    }
  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Erro interno no servidor.' }),
    };
  }
};

export { handler };
