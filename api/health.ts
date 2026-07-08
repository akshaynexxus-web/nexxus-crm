export default function handler(req: any, res: any) {
  return res.status(200).json({
    success: true,
    runtime: 'vercel-function',
    version: 'crm-health-2026-07-08',
  })
}
