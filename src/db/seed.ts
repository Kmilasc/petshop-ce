import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { hashPassword } from "../lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://petshop:petshop123@localhost:5432/petshop",
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Iniciando seed...");

  // Categories
  const cats = await db
    .insert(schema.categories)
    .values([
      { name: "Ração Seca",       emoji: "🦴", slug: "racao-seca",     description: "Ração seca para cães e gatos",              petType: "dog" },
      { name: "Ração Úmida",      emoji: "🥫", slug: "racao-umida",    description: "Ração úmida e patê",                        petType: "cat" },
      { name: "Petiscos & Snacks",emoji: "🍖", slug: "petiscos",       description: "Petiscos e recompensas",                    petType: "dog" },
      { name: "Brinquedos",       emoji: "🎾", slug: "brinquedos",     description: "Brinquedos e diversão",                     petType: "dog" },
      { name: "Coleiras & Guias", emoji: "🏷️", slug: "coleiras-guias", description: "Coleiras, guias e peitorais",               petType: "dog" },
      { name: "Camas & Casinhas", emoji: "🛏️", slug: "camas-casinhas", description: "Conforto e descanso",                       petType: "dog" },
      { name: "Higiene & Saúde",  emoji: "🛁", slug: "higiene-saude",  description: "Banho, tosa e saúde",                       petType: "dog" },
      { name: "Aquários",         emoji: "🐠", slug: "aquarios",       description: "Tudo para aquários e peixes",               petType: "fish" },
      { name: "Aves",             emoji: "🦜", slug: "aves",           description: "Gaiolas, rações e acessórios para pássaros",petType: "bird" },
      { name: "Roedores",         emoji: "🐹", slug: "roedores",       description: "Hamsters, coelhos e roedores",               petType: "hamster" },
      { name: "Répteis",          emoji: "🦎", slug: "repteis",         description: "Terrários, lâmpadas e acessórios para répteis", petType: "reptile" },
      { name: "Coelhos",          emoji: "🐰", slug: "coelhos",         description: "Rações, gaiolas e acessórios para coelhos",    petType: "rabbit" },
    ])
    .returning();

  console.log(`✓ ${cats.length} categorias criadas`);

  const catMap: Record<string, number> = {};
  cats.forEach((c) => { catMap[c.slug] = c.id; });

  // Products
  const products = await db
    .insert(schema.products)
    .values([
      // Dog food
      {
        name: "Ração Royal Canin Adult Cão 15kg",
        slug: "racao-royal-canin-adult-cao-15kg",
        description: "Ração premium para cães adultos de médio porte. Rica em proteínas de alta qualidade.",
        price: "189.90",
        originalPrice: "229.90",
        stock: 50,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1090509-368-368/Racao-Royal-Canin-Medium-Adult-para-Caes-Adultos-Porte-Medio.webp.webp?v=638978659389800000",
        categoryId: catMap["racao-seca"],
        petType: "dog",
        brand: "Royal Canin",
        weight: "15kg",
        featured: true,
      },
      {
        name: "Ração Golden Formula Raças Grandes 20kg",
        slug: "racao-golden-formula-racas-grandes-20kg",
        description: "Nutrição completa para cães de raças grandes. Com glucosamina para articulações.",
        price: "149.90",
        originalPrice: null,
        stock: 35,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/820804-368-368/racao-golden-formula-para-caes-adultos-frango-e-arroz-3kg.jpg?v=638122535529200000",
        categoryId: catMap["racao-seca"],
        petType: "dog",
        brand: "Golden",
        weight: "20kg",
        featured: false,
      },
      {
        name: "Ração Pedigree Adulto Carne 10kg",
        slug: "racao-pedigree-adulto-carne-10kg",
        description: "Ração completa com carne e vegetais para cães adultos.",
        price: "89.90",
        stock: 60,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1058724-368-368/Racao-Pedigree-Caes-Adultos-Racas-Medias-e-Grandes-Carne-e-Vegetais-900g.png?v=638887169791230000",
        categoryId: catMap["racao-seca"],
        petType: "dog",
        brand: "Pedigree",
        weight: "10kg",
        featured: false,
      },
      // Cat food
      {
        name: "Ração Royal Canin Cat Indoor 4kg",
        slug: "racao-royal-canin-cat-indoor-4kg",
        description: "Desenvolvida para gatos que vivem exclusivamente em casa. Controla peso e bolas de pelo.",
        price: "129.90",
        originalPrice: "149.90",
        stock: 40,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/995091-368-368",
        categoryId: catMap["racao-seca"],
        petType: "cat",
        brand: "Royal Canin",
        weight: "4kg",
        featured: true,
      },
      {
        name: "Patê Whiskas Atum Gato Adulto 12x85g",
        slug: "pate-whiskas-atum-gato-adulto",
        description: "Patê saboroso de atum para gatos adultos. Rico em proteínas.",
        price: "52.90",
        stock: 80,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1051221-368-368/Racao-Umida-Whiskas-Pate-Atum-290-g.png?v=638324581807800000",
        categoryId: catMap["racao-umida"],
        petType: "cat",
        brand: "Whiskas",
        weight: "12x85g",
        featured: false,
      },
      // Treats
      {
        name: "Petisco Ossinho Milkbone Médio 500g",
        slug: "petisco-ossinho-milkbone-medio-500g",
        description: "Biscoito dental que ajuda a limpar os dentes. Sabor carne.",
        price: "24.90",
        stock: 100,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/815629-368-368/petisco-para-caes-adultos-racas-pequenas-frango-42g_1.jpg?v=638781704697670000",
        categoryId: catMap["petiscos"],
        petType: "dog",
        brand: "MilkBone",
        weight: "500g",
        featured: false,
      },
      {
        name: "Petisco Frango Desidratado para Cães 200g",
        slug: "petisco-frango-desidratado-caes-200g",
        description: "100% natural, apenas frango desidratado. Sem conservantes.",
        price: "39.90",
        originalPrice: "49.90",
        stock: 55,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1043976-368-368/Snack-Peito-de-Frango-Desidratado-LL-Pet.png?v=638150797332470000",
        categoryId: catMap["petiscos"],
        petType: "dog",
        brand: "PetNatural",
        weight: "200g",
        featured: true,
      },
      // Toys
      {
        name: "Bola Kong Classic Médio",
        slug: "bola-kong-classic-medio",
        description: "Brinquedo interativo de borracha natural. Pode ser recheado com petiscos.",
        price: "69.90",
        stock: 30,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1063784-368-368/Brinquedo-Mordedor-Kong-Classic-1.png?v=638672035168170000",
        categoryId: catMap["brinquedos"],
        petType: "dog",
        brand: "Kong",
        featured: true,
      },
      {
        name: "Varinha Pluma Interativa para Gatos",
        slug: "varinha-pluma-interativa-gatos",
        description: "Brinquedo interativo com pluma e guizo. Estimula o instinto de caça.",
        price: "19.90",
        stock: 70,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1037344-368-368/Varinha--magica-animania.png?v=638143112212000000",
        categoryId: catMap["brinquedos"],
        petType: "cat",
        brand: "PetPlay",
        featured: false,
      },
      {
        name: "Brinquedo Corda Knot Fun Grande",
        slug: "brinquedo-corda-knot-fun-grande",
        description: "Corda trançada multicolorida para cabo de guerra e morder.",
        price: "34.90",
        stock: 45,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1046727-368-368/Brinquedo-Corda-Trancada-para-Caes-Savana-7908405901836-1.png?v=638207284460000000",
        categoryId: catMap["brinquedos"],
        petType: "dog",
        brand: "KnotFun",
        featured: false,
      },
      // Collars
      {
        name: "Coleira Antipulgas Seresto Cão Grande",
        slug: "coleira-antipulgas-seresto-cao-grande",
        description: "Proteção contra pulgas e carrapatos por até 8 meses.",
        price: "119.90",
        originalPrice: "139.90",
        stock: 25,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1080746-368-368/Seresto-Maior-que-8.webp?v=638929321374700000",
        categoryId: catMap["coleiras-guias"],
        petType: "dog",
        brand: "Seresto",
        featured: true,
      },
      {
        name: "Guia Retrátil Flexi New Classic 5m",
        slug: "guia-retratil-flexi-new-classic-5m",
        description: "Guia retrátil de 5 metros para cães até 15kg. Com trava de segurança.",
        price: "89.90",
        stock: 20,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/927936-368-368/Guia-New-Classic-Caes-Pequeno-Porte-5m-Preta-Flexi-SemCaixa.jpg?v=638134713914270000",
        categoryId: catMap["coleiras-guias"],
        petType: "dog",
        brand: "Flexi",
        featured: false,
      },
      // Beds
      {
        name: "Cama Pet Dreams Pelúcia Redonda Média",
        slug: "cama-pet-dreams-pelucia-redonda-media",
        description: "Cama super macia em pelúcia. Antiderrapante. Lavável na máquina.",
        price: "79.90",
        originalPrice: "99.90",
        stock: 30,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1070776-368-368/Cama-Redonda-Azul-Fabrica-Pet.jpg?v=638804252448070000",
        categoryId: catMap["camas-casinhas"],
        petType: "dog",
        brand: "PetDreams",
        featured: false,
      },
      {
        name: "Arranhador Gato Torre com Cama 60cm",
        slug: "arranhador-gato-torre-cama-60cm",
        description: "Arranhador em sisal com cama no topo. Ideal para exercício e descanso.",
        price: "149.90",
        stock: 15,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/928910-368-368/Principal---Arranhador-3783870.jpg",
        categoryId: catMap["camas-casinhas"],
        petType: "cat",
        brand: "CatHome",
        featured: true,
      },
      // Hygiene
      {
        name: "Shampoo Sanol Dog Neutro 500ml",
        slug: "shampoo-sanol-dog-neutro-500ml",
        description: "Shampoo de pH neutro para cães. Suave e hidratante.",
        price: "22.90",
        stock: 90,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1068522-368-368/Shampoo-Neutro-Caes-e-Gatos-Sanol.png.png?v=638759955788770000",
        categoryId: catMap["higiene-saude"],
        petType: "dog",
        brand: "Sanol",
        weight: "500ml",
        featured: false,
      },
      {
        name: "Escova Dentes + Pasta Pet Kiss Kit",
        slug: "escova-dentes-pasta-pet-kiss-kit",
        description: "Kit higiene bucal para cães. Sabor frango. Previne tártaro.",
        price: "34.90",
        stock: 50,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/216279-368-368/Kit-Escova-e-Creme-Dental-Animalissimo.jpg?v=638134678191230000",
        categoryId: catMap["higiene-saude"],
        petType: "dog",
        brand: "PetKiss",
        featured: false,
      },
      // Fish
      {
        name: "Aquário Boyu 50L com Filtro e Iluminação LED",
        slug: "aquario-boyu-50l-filtro-led",
        description: "Aquário completo com filtro interno e iluminação LED. Ideal para iniciantes.",
        price: "349.90",
        originalPrice: "449.90",
        stock: 10,
        imageUrl: "https://www.aquaricamp.com.br/media/catalog/product/cache/1/thumbnail/600x/17f82f742ffe127f42dca9de82fb58b1/e/a/ea-60e.jpg",
        categoryId: catMap["aquarios"],
        petType: "fish",
        brand: "Boyu",
        featured: true,
      },
      {
        name: "Ração Tetra Goldfish 100g",
        slug: "racao-tetra-goldfish-100g",
        description: "Ração em flocos para carpas e peixes dourados. Não turva a água.",
        price: "19.90",
        stock: 80,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/183785-368-368/Goldfish-12g_sachet_2--.jpg?v=636125566416830000",
        categoryId: catMap["aquarios"],
        petType: "fish",
        brand: "Tetra",
        weight: "100g",
        featured: false,
      },
      // Birds
      {
        name: "Gaiola Canário Dupla Arame 50cm",
        slug: "gaiola-canario-dupla-arame-50cm",
        description: "Gaiola espaçosa em arame galvanizado. Com comedouro e bebedouro.",
        price: "89.90",
        stock: 12,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/803068-368-368/Gaiola-Brasileira-Canario-Vermelha-Quatigua.jpg?v=637643791836930000",
        categoryId: catMap["aves"],
        petType: "bird",
        brand: "PetHome",
        featured: false,
      },
      // Reptile
      {
        name: "Terrário Simples Lester para Répteis",
        slug: "terrario-simples-lester-repteis",
        description: "Terrário em vidro ideal para répteis, aranhas e anfíbios. Tampa com tela para ventilação.",
        price: "149.90",
        stock: 12,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/851031-368-368",
        categoryId: catMap["repteis"],
        petType: "reptile",
        brand: "Lester",
        featured: true,
      },
      {
        name: "Terrário com Ilha para Tartarugas Lester",
        slug: "terrario-ilha-tartarugas-lester",
        description: "Terrário semi-aquático com ilha flutuante. Ideal para tartarugas e cágados.",
        price: "199.90",
        originalPrice: "249.90",
        stock: 8,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1097819-368-368/Aquario-Terrario-com-Ilha-Lester.webp?v=639081532378300000",
        categoryId: catMap["repteis"],
        petType: "reptile",
        brand: "Lester",
        featured: false,
      },
      // Rabbit
      {
        name: "Ração para Coelho Presence 5kg",
        slug: "racao-coelho-presence-5kg",
        description: "Alimentação completa para coelhos e mini coelhos. Rica em fibras vegetais.",
        price: "59.90",
        stock: 25,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1047091-368-368/Racao-para-Coelho-Presence-5-kg.png?v=638219126167170000",
        categoryId: catMap["coelhos"],
        petType: "rabbit",
        brand: "Presence",
        weight: "5kg",
        featured: false,
      },
      {
        name: "Ração Nutrópica para Coelho Adulto 1,5kg",
        slug: "racao-nutropica-coelho-adulto",
        description: "Alimento extrusado super premium para coelhos adultos a partir de 9 meses.",
        price: "49.90",
        originalPrice: "59.90",
        stock: 30,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1085529-368-368",
        categoryId: catMap["coelhos"],
        petType: "rabbit",
        brand: "Nutrópica",
        weight: "1,5kg",
        featured: true,
      },
      {
        name: "Gaiola para Coelhos com Bandeja Monaco",
        slug: "gaiola-coelhos-bandeja-monaco",
        description: "Gaiola espaçosa com bandeja plástica removível. Fácil de limpar. Ideal para coelhos de todos os portes.",
        price: "189.90",
        originalPrice: "229.90",
        stock: 10,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/982001-368-368/gaiola-para-coelhos-com-bandeja-plastica-monaco-3179213.jpg?v=638787033578000000",
        categoryId: catMap["coelhos"],
        petType: "rabbit",
        brand: "Monaco",
        featured: false,
      },
      // Rabbit/hamster
      {
        name: "Gaiola Hamster Habitrail OVO 38cm",
        slug: "gaiola-hamster-habitrail-ovo-38cm",
        description: "Gaiola modular com rodinha, bebedouro e casa. Sistema de tubos expansível.",
        price: "129.90",
        originalPrice: "159.90",
        stock: 8,
        imageUrl: "https://cobasi.vteximg.com.br/arquivos/ids/1055985-368-368/gaiola-para-hamster-cabana-braganca-branca.png?v=638479174223200000",
        categoryId: catMap["roedores"],
        petType: "hamster",
        brand: "Habitrail",
        featured: false,
      },
    ])
    .returning();

  console.log(`✓ ${products.length} produtos criados`);

  // Admin user
  const adminHash = await hashPassword("admin123");
  await db
    .insert(schema.users)
    .values({
      name: "Admin PetShop",
      email: "admin@petshop.com",
      passwordHash: adminHash,
      role: "admin",
    })
    .onConflictDoNothing();

  console.log("✓ Usuário admin criado (admin@petshop.com / admin123)");
  console.log("✅ Seed concluído!");
  await pool.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
