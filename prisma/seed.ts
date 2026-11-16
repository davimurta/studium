// Popula o banco com os dados de exemplo do prototipo.
// Uso: npm run seed (usa SEED_EMAIL e SEED_PASSWORD, com valores padrao abaixo).
// Atencao: apaga os topicos, roadmaps e sessoes do usuario de exemplo antes de recriar.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Status } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const EMAIL = (process.env.SEED_EMAIL ?? "demo@estudos.dev").toLowerCase();
const PASSWORD = process.env.SEED_PASSWORD ?? "estudos123";
const TIME_ZONE = "America/Sao_Paulo";

// Data "do dia" no fuso de Sao Paulo, gravada como meia-noite UTC (coluna @db.Date).
function dayOffset(daysAgo: number): Date {
  const now = new Date(Date.now() - daysAgo * 86_400_000);
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
  return new Date(`${ymd}T00:00:00.000Z`);
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

type TopicSeed = {
  title: string;
  tags: string[];
  status: Status;
  updatedDaysAgo: number;
  // [dias atras, minutos]
  sessions: [number, number][];
};

const TOPICS: TopicSeed[] = [
  {
    title: "Next.js App Router",
    tags: ["react", "nextjs"],
    status: "STUDYING",
    updatedDaysAgo: 0,
    sessions: [[0, 45], [2, 70], [4, 30], [6, 40], [8, 25], [10, 30], [12, 20]],
  },
  {
    title: "TypeScript avançado",
    tags: ["typescript"],
    status: "STUDYING",
    updatedDaysAgo: 1,
    sessions: [[1, 60], [3, 75], [5, 90], [9, 60], [15, 80]],
  },
  {
    title: "Estruturas de dados",
    tags: ["algoritmos"],
    status: "STUDYING",
    updatedDaysAgo: 2,
    sessions: [[2, 90], [3, 60], [11, 120], [20, 120], [30, 160]],
  },
  {
    title: "SQL e modelagem",
    tags: ["banco de dados"],
    status: "STUDYING",
    updatedDaysAgo: 3,
    sessions: [[3, 45], [5, 60], [18, 120]],
  },
  {
    title: "Docker básico",
    tags: ["devops"],
    status: "STUDYING",
    updatedDaysAgo: 5,
    sessions: [[4, 30], [5, 60]],
  },
  {
    title: "Flutter widgets",
    tags: ["mobile", "flutter"],
    status: "NOT_STARTED",
    updatedDaysAgo: 7,
    sessions: [],
  },
  {
    title: "Drupal theming",
    tags: ["php", "drupal"],
    status: "DONE",
    updatedDaysAgo: 8,
    sessions: [[25, 120], [40, 90], [55, 90]],
  },
  {
    title: "Inglês técnico",
    tags: ["idiomas"],
    status: "DONE",
    updatedDaysAgo: 14,
    sessions: [[35, 75], [60, 60]],
  },
  {
    title: "Git avançado",
    tags: ["git"],
    status: "DONE",
    updatedDaysAgo: 15,
    sessions: [[45, 60], [70, 60]],
  },
  {
    title: "Acessibilidade web",
    tags: ["a11y", "html"],
    status: "DONE",
    updatedDaysAgo: 21,
    sessions: [[50, 90], [80, 120]],
  },
];

const NOTE = `## Server Components por padrão

No App Router, todo componente é Server Component até que alguém declare a diretiva de cliente. Isso reduz o JavaScript enviado ao navegador e aproxima a busca de dados de quem a usa.

- Busca de dados direto no componente, com async e await
- Layouts aninhados preservam estado entre rotas
- Loading e error definidos por segmento de rota

\`\`\`tsx
export default async function Page() {
  const topics = await getTopics();
  // renderizado no servidor
}
\`\`\`

## Dúvidas

- Quando vale usar Route Handlers em vez de Server Actions?
- Como o cache do fetch se comporta em produção?
`;

type ItemSeed = { title: string; topic?: string; status?: Status; children?: ItemSeed[] };

type RoadmapSeed = {
  title: string;
  description: string;
  updatedDaysAgo: number;
  items: ItemSeed[];
};

function filler(prefix: string, done: number, total: number, start = 0): ItemSeed[] {
  return Array.from({ length: total }, (_, i) => ({
    title: `${prefix} ${i + 1 + start}`,
    status: i < done ? "DONE" : "NOT_STARTED",
  }));
}

const ROADMAPS: RoadmapSeed[] = [
  {
    title: "Front-end avançado",
    description: "Da base moderna de HTML e CSS até performance, design systems e deploy.",
    updatedDaysAgo: 0,
    items: [
      {
        title: "HTML e CSS modernos",
        status: "DONE",
        children: [
          { title: "HTML semântico", status: "DONE" },
          { title: "Flexbox e Grid", status: "DONE" },
          { title: "Responsividade", status: "DONE" },
        ],
      },
      {
        title: "JavaScript moderno",
        status: "DONE",
        children: [
          { title: "Módulos ES", status: "DONE" },
          { title: "Async e await", status: "DONE" },
          { title: "Fetch API", status: "DONE" },
        ],
      },
      { title: "Git avançado", topic: "Git avançado" },
      { title: "Fundamentos de React", status: "DONE" },
      { title: "Gerenciamento de estado", status: "DONE" },
      { title: "Testes com Vitest", status: "DONE" },
      { title: "Acessibilidade web", topic: "Acessibilidade web" },
      { title: "TypeScript avançado", topic: "TypeScript avançado" },
      {
        title: "Next.js App Router",
        topic: "Next.js App Router",
        children: [
          { title: "Server Components", status: "DONE" },
          { title: "Server Actions", status: "STUDYING" },
          { title: "Cache e revalidação" },
        ],
      },
      {
        title: "Performance web",
        children: [{ title: "Core Web Vitals" }, { title: "Imagens e fontes" }, { title: "Bundle splitting" }],
      },
      { title: "Design systems" },
      { title: "Deploy e CI/CD" },
    ],
  },
  {
    title: "Ciência da Computação",
    description: "Estruturas de dados, algoritmos, bancos de dados e redes ao longo do curso.",
    updatedDaysAgo: 2,
    items: [
      { title: "Lógica de programação", status: "DONE" },
      { title: "Matemática discreta", status: "DONE" },
      { title: "Arquitetura de computadores", status: "DONE" },
      { title: "Sistemas operacionais", status: "DONE" },
      { title: "Estruturas de dados", topic: "Estruturas de dados" },
      { title: "SQL e modelagem", topic: "SQL e modelagem" },
      ...filler("Módulo", 0, 9, 6),
    ],
  },
  {
    title: "Mobile com Flutter",
    description: "Widgets, navegação, estado e publicação do primeiro app.",
    updatedDaysAgo: 7,
    items: [
      { title: "Instalação e ambiente", status: "DONE" },
      { title: "Flutter widgets", topic: "Flutter widgets" },
      ...filler("Etapa", 0, 8, 2),
    ],
  },
  {
    title: "Inglês para desenvolvedores",
    description: "Leitura de documentação, escrita técnica e reuniões em inglês.",
    updatedDaysAgo: 14,
    items: [
      { title: "Vocabulário técnico", status: "DONE" },
      { title: "Leitura de documentação", status: "DONE" },
      { title: "Inglês técnico", topic: "Inglês técnico" },
      ...filler("Etapa", 0, 5, 3),
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const user = await db.user.upsert({
    where: { email: EMAIL },
    update: {},
    create: { email: EMAIL, name: "Demo", passwordHash },
  });

  await db.$transaction([
    db.studyLog.deleteMany({ where: { userId: user.id } }),
    db.roadmap.deleteMany({ where: { userId: user.id } }),
    db.topic.deleteMany({ where: { userId: user.id } }),
  ]);

  const topicIds = new Map<string, string>();
  for (const t of TOPICS) {
    const topic = await db.topic.create({
      data: {
        userId: user.id,
        title: t.title,
        tags: t.tags,
        status: t.status,
        createdAt: daysAgo(12 + t.updatedDaysAgo),
        studyLogs: {
          create: t.sessions.map(([d, minutes]) => ({
            userId: user.id,
            minutes,
            date: dayOffset(d),
            createdAt: daysAgo(d),
          })),
        },
      },
    });
    topicIds.set(t.title, topic.id);
  }

  const nextTopicId = topicIds.get("Next.js App Router")!;
  await db.note.create({ data: { topicId: nextTopicId, content: NOTE } });
  await db.resource.createMany({
    data: [
      { topicId: nextTopicId, title: "Documentação oficial", url: "https://nextjs.org/docs" },
      { topicId: nextTopicId, title: "Curso introdutório", url: "https://nextjs.org/learn" },
    ],
  });

  for (const r of ROADMAPS) {
    const roadmap = await db.roadmap.create({
      data: { userId: user.id, title: r.title, description: r.description },
    });
    for (const [position, item] of r.items.entries()) {
      await db.roadmapItem.create({
        data: {
          roadmapId: roadmap.id,
          title: item.title,
          position,
          topicId: item.topic ? topicIds.get(item.topic) : undefined,
          status: item.status ?? "NOT_STARTED",
          children: {
            create: (item.children ?? []).map((child, childPosition) => ({
              roadmapId: roadmap.id,
              title: child.title,
              position: childPosition,
              topicId: child.topic ? topicIds.get(child.topic) : undefined,
              status: child.status ?? "NOT_STARTED",
            })),
          },
        },
      });
    }
  }

  // @updatedAt e sempre "agora" na criacao; ajusta para refletir o prototipo.
  for (const t of TOPICS) {
    await db.$executeRaw`UPDATE "Topic" SET "updatedAt" = ${daysAgo(t.updatedDaysAgo)} WHERE id = ${topicIds.get(t.title)}`;
  }
  for (const r of ROADMAPS) {
    await db.$executeRaw`UPDATE "Roadmap" SET "updatedAt" = ${daysAgo(r.updatedDaysAgo)} WHERE "userId" = ${user.id} AND title = ${r.title}`;
  }

  console.log(`Seed concluído para ${EMAIL} (senha: ${PASSWORD}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
