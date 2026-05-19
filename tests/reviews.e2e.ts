/**
 * E2E tests for /api/reviews
 * Run against a local dev server pointing to the cloud DB.
 * Usage: DATABASE_URL=<cloud_url> JWT_SECRET=<secret> npx tsx tests/reviews.e2e.ts
 */

const BASE = "http://localhost:3000";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function getToken(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@petshop.com", password: "admin123" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login falhou: ${JSON.stringify(data)}`);
  return data.token;
}

async function deleteUserReview(token: string, productId: number) {
  // cleanup: delete via raw DB not exposed — we skip and use a fresh user each run
  // or we catch the 409 and treat as acceptable in cleanup context
}

async function run() {
  console.log("\n🧪 Reviews E2E Tests\n");

  // --- GET sem productId ---
  await test("GET sem productId retorna 400", async () => {
    const res = await fetch(`${BASE}/api/reviews`);
    assert(res.status === 400, `Esperado 400, recebeu ${res.status}`);
  });

  // --- GET produto inexistente retorna lista vazia ---
  await test("GET produto sem avaliações retorna avg null e total 0", async () => {
    const res = await fetch(`${BASE}/api/reviews?productId=999999`);
    assert(res.ok, `Esperado 200, recebeu ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.reviews), "reviews deve ser array");
    assert(data.reviews.length === 0, "deve estar vazio");
    assert(data.avg === null, "avg deve ser null");
    assert(data.total === 0, "total deve ser 0");
  });

  // --- GET produto válido ---
  await test("GET productId=1 retorna estrutura correta", async () => {
    const res = await fetch(`${BASE}/api/reviews?productId=1`);
    const data = await res.json();
    assert(res.ok, `Esperado 200, recebeu ${res.status} - ${JSON.stringify(data)}`);
    assert(Array.isArray(data.reviews), "reviews deve ser array");
    assert("total" in data, "deve ter campo total");
    // avg pode ser null (sem avaliações) ou number
    assert(data.avg === null || typeof data.avg === "number", "avg deve ser null ou number");
  });

  // --- POST sem autenticação ---
  await test("POST sem token retorna 401", async () => {
    const res = await fetch(`${BASE}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: 1, rating: 5 }),
    });
    assert(res.status === 401, `Esperado 401, recebeu ${res.status}`);
  });

  // --- POST com dados inválidos ---
  await test("POST com rating 0 retorna 400", async () => {
    const token = await getToken();
    const res = await fetch(`${BASE}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: 1, rating: 0 }),
    });
    assert(res.status === 400, `Esperado 400, recebeu ${res.status}`);
  });

  await test("POST com rating 6 retorna 400", async () => {
    const token = await getToken();
    const res = await fetch(`${BASE}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: 1, rating: 6 }),
    });
    assert(res.status === 400, `Esperado 400, recebeu ${res.status}`);
  });

  // --- POST válido (cria um usuário temporário para não colidir com reviews existentes) ---
  const tempEmail = `test_${Date.now()}@e2e.com`;
  let tempToken = "";

  await test("Registro de usuário temporário para teste", async () => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Teste E2E",
        email: tempEmail,
        password: "senha123",
        cpf: "529.982.247-25", // CPF válido de teste
      }),
    });
    const data = await res.json();
    assert(res.ok, `Registro falhou: ${JSON.stringify(data)}`);
    tempToken = data.token;
  });

  let productIdUsed = 1;

  await test("POST avaliação válida retorna 200 com review", async () => {
    const res = await fetch(`${BASE}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tempToken}` },
      body: JSON.stringify({ productId: productIdUsed, rating: 4, comment: "Ótimo produto!" }),
    });
    const data = await res.json();
    assert(res.ok, `Esperado 200, recebeu ${res.status}: ${JSON.stringify(data)}`);
    assert(data.review?.id !== undefined, "deve retornar review com id");
    assert(data.review.rating === 4, "rating deve ser 4");
  });

  await test("GET após POST reflete a nova avaliação no avg e total", async () => {
    const res = await fetch(`${BASE}/api/reviews?productId=${productIdUsed}`);
    const data = await res.json();
    assert(res.ok, `Esperado 200, recebeu ${res.status}`);
    assert(data.total >= 1, `total deve ser >= 1, recebeu ${data.total}`);
    assert(data.avg !== null, "avg não deve ser null após avaliação");
    assert(data.avg >= 1 && data.avg <= 5, `avg deve estar entre 1 e 5, recebeu ${data.avg}`);
    const found = data.reviews.find((r: any) => r.comment === "Ótimo produto!");
    assert(found !== undefined, "avaliação criada deve aparecer na listagem");
  });

  await test("POST duplicado retorna 409", async () => {
    const res = await fetch(`${BASE}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tempToken}` },
      body: JSON.stringify({ productId: productIdUsed, rating: 3 }),
    });
    assert(res.status === 409, `Esperado 409, recebeu ${res.status}`);
  });

  // Summary
  console.log(`\n${passed + failed} testes — ${passed} passaram, ${failed} falharam\n`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => { console.error("Erro fatal:", e); process.exit(1); });
