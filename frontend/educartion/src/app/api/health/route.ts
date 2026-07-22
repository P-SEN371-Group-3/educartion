export async function GET() {
	console.log("Health endpoint hit");
	return Response.json({ ok: true });
}
