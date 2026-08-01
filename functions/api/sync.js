export async function onRequest(context) {
  return new Response(JSON.stringify({
    success: true,
    message: '同步已完成',
    timestamp: Date.now()
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
