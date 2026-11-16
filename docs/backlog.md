# Backlog

Ideias anotadas para depois das fases do MVP.

## Importar roadmap a partir de um arquivo .md

Pedido em 14/11/2026. Permitir enviar (ou colar) um arquivo Markdown e criar o roadmap inteiro a partir dele, já com etapas principais, subetapas, status e vínculos com tópicos.

### Formato proposto

```md
# Front-end avançado

Da base moderna de HTML e CSS até performance, design systems e deploy.

## HTML e CSS modernos [x]
- [x] HTML semântico
- [x] Flexbox e Grid
- [ ] Responsividade

## JavaScript moderno [~]
- Módulos ES
- [~] Async e await

## Next.js App Router @topico(Next.js App Router)
- Server Components
- [ ] Cache e revalidação

## Deploy e CI/CD
```

Regras:

| Markdown | Vira |
|---|---|
| `# Título` (primeira linha) | título do roadmap |
| parágrafos logo abaixo do `#` | descrição do roadmap |
| `## Texto` | etapa principal, na ordem do arquivo |
| `- Texto` abaixo de um `##` | subetapa daquela etapa |
| `[x]` | Concluído |
| `[~]` | Estudando |
| `[ ]` ou nada | Não iniciado |
| `@topico(Nome)` | liga a etapa ao tópico com esse título (sem diferenciar maiúsculas); se não existir, cria o tópico |

### Notas de implementação

- Parser puro em `src/lib/roadmap-markdown.ts` (sem dependências), com testes de unidade.
- Server Action `importRoadmap(formData)`: valida tamanho (por exemplo até 100 KB), faz o parse, mostra os erros por linha e cria tudo em uma transação.
- Tela: botão "Importar .md" ao lado de "Novo roadmap", com dialog que aceita arquivo ou texto colado e mostra uma prévia (quantas etapas e subetapas) antes de confirmar.
- Exportar no mesmo formato ("Baixar .md") sai quase de graça e ajuda a editar fora do app.
- Upload de arquivo está fora do escopo do MVP; ler o arquivo no navegador (FileReader) e enviar o texto evita guardar arquivos no servidor.
