/**
 * Vercel server-side gateway.
 *
 * Browser never sees:
 * - Apps Script URL
 * - WEBAPP_SECRET
 *
 * Required Vercel Environment Variables:
 * APPS_SCRIPT_URL
 * WEBAPP_SECRET
 */

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  }

  const appsScriptUrl =
    process.env.APPS_SCRIPT_URL;

  const secret =
    process.env.WEBAPP_SECRET;

  if (!appsScriptUrl || !secret) {
    return res.status(500).json({
      ok: false,
      error:
        'Vercel Environment Variables APPS_SCRIPT_URL / WEBAPP_SECRET belum dikonfigurasi.'
    });
  }

  try {

    const payload = {
      ...(req.body || {}),
      secret
    };

    const upstream =
      await fetch(
        appsScriptUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify(payload),
          redirect: 'follow'
        }
      );

    const raw =
      await upstream.text();

    let data;

    try {
      data =
        JSON.parse(raw);

    } catch (_) {
      return res
        .status(502)
        .json({
          ok: false,
          error:
            'Apps Script memulangkan respons yang tidak sah.',
          detail:
            raw.slice(0, 500)
        });
    }

    if (!data.ok) {
      return res
        .status(400)
        .json(data);
    }

    return res
      .status(200)
      .json(data);

  } catch (error) {

    return res
      .status(500)
      .json({
        ok: false,
        error:
          error?.message ||
          String(error)
      });
  }
}
