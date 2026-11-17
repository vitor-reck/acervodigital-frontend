# 💻 Frontend Web — Acervo Digital

SPA em **React 19 + Vite 8**, com **React Router 7**, **Axios**, **Material UI 9** e testes em **Vitest + Testing Library**. Consome a API REST do backend ([docs/backend-apis.md](../../docs/backend-apis.md)). JavaScript puro (sem TypeScript).

- Prints de como cada tela deve ficar: [docs/frontend-web.md, tópico 7](../../docs/frontend-web.md#7-divisão-de-telas-por-integrante)
- Protótipo navegável de referência: [`prototipo/`](prototipo/)

## Sumário

- [1. Visão geral](#1-visão-geral)
- [2. Pré-requisitos](#2-pré-requisitos)
- [3. Executar localmente](#3-executar-localmente)
- [4. Configuração e integração com a API](#4-configuração-e-integração-com-a-api)
- [5. Estrutura do projeto](#5-estrutura-do-projeto)
- [6. Módulos e estado da implementação](#6-módulos-e-estado-da-implementação)
- [7. Arquitetura e padrões de implementação](#7-arquitetura-e-padrões-de-implementação)
- [8. Testes automatizados](#8-testes-automatizados)
- [9. Convenções de desenvolvimento](#9-convenções-de-desenvolvimento)
- [10. CI, conteinerização e deploy](#10-ci-conteinerização-e-deploy)
- [11. Solução de problemas](#11-solução-de-problemas)

---

## 1. Visão geral

O Acervo Digital Web é uma SPA (Single-Page Application) para leitores e bibliotecários. A aplicação é construída em JavaScript e React, e consome a API REST do projeto. Ela não acessa o MongoDB diretamente: autenticação, autorização, regras de negócio e persistência são responsabilidade do backend.

- **Interface**: React 19, React Router 7 e Material UI 9.
- **Build e desenvolvimento**: Vite 8.
- **Comunicação HTTP**: Axios, encapsulado em `src/api/`.
- **Testes**: Vitest, Testing Library e `user-event`.
- **Distribuição em container**: build estático servido por Nginx.
- **Autenticação**: token JWT armazenado no navegador e enviado como `Authorization: Bearer`.

As páginas são carregadas sob demanda por rota. O `AuthContext` mantém a sessão e os perfis `user` e `librarian`; componentes e hooks compartilhados padronizam carregamento assíncrono, formulários, feedback e paginação.

---

## 2. Pré-requisitos

- **Com Node**: Node.js 24 ou superior e npm.
- **Com Docker**: Docker Engine/Desktop e Docker Compose v2; Node não é necessário na máquina.
- **Para o fluxo local completo**: backend e MongoDB em execução, conforme [`src/backend/README.md`](../backend/README.md).

---

## 3. Executar localmente

### Com Node (24+)

```bash
cp .env.example .env
# Para usar o backend local, ajuste VITE_API_URL=http://localhost:8000 no .env
npm install
npm run dev
```

Abra `http://localhost:5173`. Para encerrar o servidor, use `Ctrl+C`.

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor Vite com recarga durante o desenvolvimento, porta 5173 |
| `npm test` | Executa a suíte Vitest uma vez |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run build` | Gera os arquivos estáticos em `dist/` |
| `npm run preview` | Serve localmente o build, por padrão na porta 4173 |

### Com Docker (sem Node instalado)

No primeiro terminal, inicie o backend local:

```bash
cd src/backend
cp .env.example .env
docker compose up --build -d
```

No segundo terminal, inicie o frontend em modo de desenvolvimento:

```bash
cd src/frontend
cp .env.example .env
# Configure VITE_API_URL=http://localhost:8000
docker compose up dev
```

O frontend fica disponível em `http://localhost:5173` e o backend em `http://localhost:8000`. O serviço `dev` está no perfil Compose `dev` e monta o código local no container.

Para servir o build de produção via Nginx em `http://localhost:8080`:

```bash
cd src/frontend
docker compose up --build web
```

Para parar os serviços do frontend, use `docker compose down`. Para encerrar apenas o container de desenvolvimento, pressione `Ctrl+C` no terminal em que `docker compose up dev` está rodando.

---

## 4. Configuração e integração com a API

As variáveis do frontend são públicas e incorporadas ao bundle no build; não coloque senhas, tokens permanentes ou outros segredos nelas.

| Variável | Descrição | Padrão de `.env.example` |
| --- | --- | --- |
| `VITE_API_URL` | URL base da API, sem `/api/v1` e sem barra final | `https://acervo-digital-api.onrender.com` |

- Backend local: `VITE_API_URL=http://localhost:8000`.
- O Vite carrega a variável ao iniciar; reinicie `npm run dev` ou o serviço `dev` após alterar `.env`.
- O valor também é usado no build de produção. Para o container `web`, passe `VITE_API_URL` durante o build, por exemplo: `VITE_API_URL=https://api.exemplo.com docker compose up --build web`.
- A origem do frontend precisa estar autorizada em `CORS_ALLOWED_ORIGINS` no backend. Para desenvolvimento com Vite, inclua `http://localhost:5173`; para o container Nginx local, inclua também `http://localhost:8080`. Em produção, configure o domínio final do frontend.
- O frontend não se conecta diretamente ao MongoDB. O endereço da API é a única configuração de ambiente necessária para a aplicação Web.

### Autenticação e erros

- Cadastro e login são públicos; as demais rotas usam a sessão JWT do `AuthContext`.
- O cliente em `src/api/client.js` inclui automaticamente o token em `Authorization: Bearer <token>`.
- Ao receber `401`, a sessão local é removida e a aplicação solicita novo login.
- Erros de rede e mensagens conhecidas do backend são convertidos para mensagens apresentáveis na interface.
- Listagens paginadas usam `{ count, next, previous, results }`; `ALL` solicita até 100 registros quando a tela precisa carregar a lista completa.
- Datas da API são convertidas para exibição no fuso de São Paulo pelos utilitários em `src/utils/format.js`.

---

## 5. Estrutura do projeto

```
src/
├── api/
│   ├── client.js       # axios: baseURL, token, 401 → logout, erros traduzidos
│   └── index.js        # uma função por endpoint (única porta de saída HTTP)
├── auth/AuthContext.jsx  # useAuth(): user, isLibrarian, login, logout
├── components/
│   ├── AppLayout.jsx   # menu lateral, barra superior, Suspense das páginas
│   ├── Feedback.jsx    # useFeedback(): notify, run, confirm
│   ├── ui.jsx          # componentes visuais reutilizáveis
│   ├── BookCard.jsx    # card de livro + BookGrid
│   └── WishlistDialog.jsx
├── hooks/              # useAsync, usePaged, useForm, useDebounced
├── utils/
│   ├── format.js       # datas, moeda, imagem, regras fixas (multa, prazo)
│   └── labels.js       # rótulos/cores de status, gêneros, condições
├── modules/<modulo>/   # páginas + index.js + <modulo>.test.jsx
├── test/               # setup e helpers de teste
├── routes.jsx          # rotas, perfis e menu
├── App.jsx             # guarda de login e de perfil
├── main.jsx            # providers
└── theme.js            # tema MUI (cores e fontes)
```

---

## 6. Módulos e estado da implementação

A base comum (tudo fora de `modules/`) é mantida pelo Marco. Telas marcadas com ⏳ estão como `Placeholder` ("Em desenvolvimento"): o arquivo, a rota e o item de menu **já existem**, falta só o conteúdo.

| Módulo          | Arquivo                 | URL                     | Perfil        | Responsável | Situação |
| --------------- | ----------------------- | ----------------------- | ------------- | ----------- | :------: |
| `auth`          | `LoginPage.jsx`         | `/login`                | Público       | Marco       | ✔️ |
| `auth`          | `RegisterPage.jsx`      | `/cadastro`             | Público       | Marco       | ✔️ |
| `dashboard`     | `ReaderDashboard.jsx` / `LibrarianDashboard.jsx` | `/` | Ambos | Marco | ✔️ |
| `jobs`          | `JobsPage.jsx`          | `/jobs`                 | Bibliotecário | Marco       | ✔️ |
| `catalog`       | `CatalogPage.jsx`       | `/acervo`               | Ambos         | Paula       | ⏳ |
| `catalog`       | `BookDetailPage.jsx`    | `/acervo/:id`           | Ambos         | Paula       | ⏳ |
| `catalog`       | `BookFormPage.jsx`      | `/acervo/novo`, `/acervo/:id/editar` | Bibliotecário | Paula | ⏳ |
| `rentals`       | `RentalsPage.jsx`       | `/locacoes`             | Ambos         | Vitor       | ✔️ |
| `rentals`       | `CirculationPage.jsx`   | `/circulacao`           | Bibliotecário | Vitor       | ✔️ |
| `fines`         | `FinesPage.jsx`         | `/multas`               | Ambos         | Igor        | ⏳ |
| `readers`       | `ReadersPage.jsx`       | `/leitores`             | Bibliotecário | Igor        | ⏳ |
| `readers`       | `ReaderDetailPage.jsx`  | `/leitores/:id`         | Bibliotecário | Igor        | ⏳ |
| `reviews`       | `MyReviewsPage.jsx`     | `/avaliacoes`           | Leitor        | Juliana     | ⏳ |
| `reviews`       | `ReviewFormPage.jsx`    | `/acervo/:id/avaliar`   | Leitor        | Juliana     | ⏳ |
| `favorites`     | `FavoritesPage.jsx`     | `/favoritos`            | Leitor        | Breno       | ⏳ |
| `wishlist`      | `WishlistPage.jsx`      | `/desejos`              | Leitor        | Breno       | ⏳ |
| `notifications` | `NotificationsPage.jsx` | `/notificacoes`         | Leitor        | Breno       | ⏳ |

"Ambos" = a mesma página atende leitor e bibliotecário, variando pelo `isLibrarian`.

---

## 7. Arquitetura e padrões de implementação

1. Abra o arquivo da sua tela em `src/modules/<modulo>/` e substitua o `<Placeholder />` pelo conteúdo. Mantenha o `export default` com o mesmo nome.
2. Não mexa em `routes.jsx`, `App.jsx` nem no menu: já estão prontos. Se precisar de algo novo na base comum, combine com o Marco.
3. Importe **somente** da base comum e do próprio módulo. Nunca importe de outro módulo.
4. Toda chamada HTTP passa pelas funções de `src/api/index.js` (nunca `axios`/`fetch` direto na página).
5. Crie `src/modules/<modulo>/<modulo>.test.jsx` com os testes da sua tela (seção 8).
6. Rode `npm test` e `npm run build` antes do push (o CI roda os dois).

Esqueleto típico de página de lista com ação:

```jsx
import { Button, Card } from '@mui/material';
import { ALL, favoritesApi } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { useFeedback } from '../../components/Feedback';
import { AsyncContent, EmptyState, PageHeader } from '../../components/ui';

export default function FavoritesPage() {
  const { run } = useFeedback();
  const state = useAsync(() => favoritesApi.list(ALL));
  const items = state.data?.results ?? [];

  const remove = async (item) => {
    if (await run(() => favoritesApi.remove(item.bookId), 'Removido dos favoritos')) state.reload();
  };

  return (
    <>
      <PageHeader title="Favoritos" subtitle={`${items.length} livro(s)`} />
      <AsyncContent state={state} isEmpty={!items.length} empty={<Card><EmptyState title="Nenhum favorito" /></Card>}>
        {/* conteúdo */}
      </AsyncContent>
    </>
  );
}
```

Referências prontas no código: [`JobsPage.jsx`](src/modules/jobs/JobsPage.jsx) (lista paginada com filtro, tabela, diálogo de detalhe) e [`LibrarianDashboard.jsx`](src/modules/dashboard/LibrarianDashboard.jsx) (várias chamadas em paralelo).

---

### Base comum — referência rápida

### Hooks

| Hook | Retorno | Uso |
| --- | --- | --- |
| `useAsync(load, deps)` | `{ data, loading, error, reload }` | Carrega dados; recarrega quando `deps` muda ou ao chamar `reload()` |
| `usePaged(load, deps)` | `{ ...useAsync, items, page, pages, setPage }` | Lista paginada no servidor; `load` recebe `{ page, pageSize }` (12 por página) e volta à página 1 quando `deps` muda |
| `useForm(initial)` | `{ form, setForm, field }` | `<TextField {...field('title')} />` liga `name`/`value`/`onChange` |
| `useDebounced(value, delay=400)` | valor atrasado | Busca enquanto digita sem disparar uma requisição por tecla |
| `useAuth()` | `{ user, isLibrarian, login, logout }` | `user`: `{ id, name, email, role }` |
| `useFeedback()` | `{ notify, run, confirm }` | Ver abaixo |

- `run(action, mensagemDeSucesso)`: executa a promise, mostra o toast de sucesso ou o erro da API e retorna o resultado (`true` se vazio) ou `undefined` se falhar. Use `if (await run(...)) state.reload()`.
- `confirm({ title, message, confirmLabel, cancelLabel, danger })`: abre diálogo e resolve `true`/`false`.
- `notify(mensagem, severity='success')`: toast avulso.

### Componentes (`components/ui.jsx` e outros)

| Componente | Props principais | Observação |
| --- | --- | --- |
| `PageHeader` | `title`, `subtitle`, `actions` | Título de toda página |
| `AsyncContent` | `state`, `isEmpty`, `empty` | Spinner/erro com "Tentar novamente" só quando ainda não há dados; num `reload` mantém o conteúdo na tela |
| `EmptyState` | `title`, `text`, `action` | Estado vazio |
| `DataTable` | `columns=[{ label, render, align }]`, `rows`, `rowKey`, `label` | `label` vira `aria-label` (útil nos testes) |
| `PageNav` | `paged` (retorno do `usePaged`) | Some quando há 1 página |
| `StatusChip` | `kind` (`rental`, `fine`, `job`, `priority`), `value` | Rótulo e cor vêm de `STATUS` |
| `KpiCard` / `KpiGrid` | `label`, `value`, `hint`, `color`, `to` | Cards de indicador |
| `BookCover` | `book` (usa `imageUrl` e `title`), `width` | Capa ou bloco colorido com o título |
| `BookCard` / `BookGrid` | `book`, `actions` | Card de livro com link para o detalhe |
| `WishlistDialog` | `open`, `title`, `initial`, `onClose`, `onSave(form)` | `form = { priority, note }` |
| `Placeholder` | `title` | Tela "Em desenvolvimento" |

### Utilitários

| Arquivo | Itens |
| --- | --- |
| `utils/format.js` | `formatDate`, `formatDateTime`, `formatMoney`, `formatReleaseDate`, `toApiDate` (`aaaa-mm-dd` → `dd-mm-aaaa`), `fromApiDate` (inverso), `imageSrc`, `dueLabel`, `daysFromToday`, `readFileAsDataUrl`, `compact` (remove filtros vazios), `FINE_PER_DAY` (R$ 2), `RENTAL_DAYS` (30) |
| `utils/labels.js` | `STATUS`, `OPEN_RENTAL_STATUSES`, `REVIEWABLE_RENTAL_STATUSES`, `CONDITIONS`, `NOTIFICATION_TYPES`, `GENRES` |

---

### Contrato da API (o que o front precisa saber)

- **Listas paginadas**: `{ count, next, previous, results }`. Parâmetros `page` e `pageSize` (máx. 100). Para trazer tudo de uma vez use `ALL` (`{ pageSize: 100 }`).
- **Erros**: o cliente já converte para `Error` com mensagem em português (`error.message`) e `error.status`. Basta usar `run(...)` ou `AsyncContent`.
- **401**: limpa a sessão e volta para o login automaticamente.
- **Datas**: `releaseDate` vem e vai em `dd-mm-aaaa`; inputs `type="date"` usam `aaaa-mm-dd` → converta com `toApiDate`/`fromApiDate`. Demais datas são ISO (use `formatDate`).
- **Capa**: envie `image` como data URL (`readFileAsDataUrl(file)`), `null` remove; exiba via `imageUrl` com `BookCover`/`imageSrc`.
- **Perfis**: `role` é `user` (leitor) ou `librarian`.

| Objeto | Funções (`src/api/index.js`) |
| --- | --- |
| `booksApi` | `list(params)`, `get(id)`, `create(data)`, `update(id, data)` (PUT), `remove(id)`, `reviews(id, params)`, `review(id, data)` |
| `reviewsApi` | `mine(params)`, `update(id, data)`, `remove(id)` |
| `rentalsApi` | `mine`, `list`, `ofUser(userId)`, `circulation`, `reserve(bookId)`, `cancelMine(id)`, `cancel(id)`, `pickup(ticket)`, `giveBack(ticket)` |
| `finesApi` | `mine`, `list`, `ofUser(userId)`, `settle(id)` |
| `favoritesApi` | `list`, `add(bookId)`, `remove(bookId)` |
| `wishlistApi` | `list`, `add(bookId, { priority, note })`, `update(bookId, data)`, `remove(bookId)` |
| `notificationsApi` | `list`, `read(id)`, `remove(id)` |
| `usersApi` | `list({ q })`, `get(id)` |
| `jobsApi` / `authApi` | `list({ status })` / `login`, `register` |

Detalhes de campos e respostas: [docs/backend-apis.md](../../docs/backend-apis.md).

---

### Comportamento previsto por tela

As regras abaixo descrevem os fluxos definidos para as telas. Consulte a tabela da seção 6 para distinguir telas já implementadas de placeholders.

**Catálogo (`/acervo`)** — filtros título, autor, gênero (`GENRES`), data de lançamento e ordenação (`ordering`: `title`, `rating`, `recent`, `stock`), com `useDebounced` + `usePaged` + `compact`. Grade de `BookCard`. Bibliotecário vê botão "Cadastrar livro".

**Detalhe do livro (`/acervo/:id`)** — capa, gênero, lançamento, disponibilidade (`stock`), sinopse, média e lista de avaliações (`booksApi.reviews`).
- Leitor: "Reservar" (desabilitado sem estoque ou com locação em aberto do livro, ver `OPEN_RENTAL_STATUSES`) → `confirm` com prazo de 30 dias e multa de R$ 2/dia → mostra o `ticketCode` em diálogo. Também favoritar/desfavoritar, adicionar/remover da lista de desejos (`WishlistDialog`) e link "Avaliar livro" só se já retirou o livro (`REVIEWABLE_RENTAL_STATUSES`) ou já avaliou.
- Bibliotecário: "Editar livro" e "Remover livro" (`confirm` com `danger`; a remoção apaga favoritos, desejos e avaliações).

**Cadastro/edição de livro** — mesma página para as duas rotas (`id` presente = edição). Campos: título, autor, gênero (`Autocomplete` livre com `GENRES`), data de lançamento, exemplares (`stock`), sinopse (até 2000) e capa (até 5 MB). Após salvar, navega para `/acervo/{id}`.

**Locações (`/locacoes`)** — leitor: `rentalsApi.mine` com filtro por status e busca por livro/ticket feitos no cliente; bibliotecário: `rentalsApi.list({ status, ticketCode })` paginado, com coluna do leitor (link para `/leitores/:id`). Cancelar somente reservas `reserved` (`cancelMine` para leitor, `cancel` para bibliotecário).

**Retirada e devolução (`/circulacao`)** — rota restrita a bibliotecários. Deve localizar o rental pelo ticket, permitir retirada apenas em `reserved` (`pickup`) e devolução apenas em `active`/`overdue` (`giveBack`), com confirmação antes de efetivar a operação.

**Multas (`/multas`)** — leitor: `finesApi.mine`; bibliotecário: `finesApi.list`, com coluna do leitor e ação "Registrar quitação" (`settle`) em pendentes. KPIs de pendentes e quitadas, filtro Todas/Pendentes/Quitadas. Valor = R$ 2 por dia de atraso.

**Leitores (`/leitores`)** — busca por nome ou e-mail (`usersApi.list({ q })`, debounce, paginado). Tabela com nome, e-mail e botão "Ver histórico".

**Histórico do leitor (`/leitores/:id`)** — `usersApi.get`, `rentalsApi.ofUser`, `finesApi.ofUser` em paralelo. KPIs, tabela de locações e de multas pendentes com quitação.

**Minhas avaliações (`/avaliacoes`)** — `reviewsApi.mine` (já traz `bookTitle` e `bookAuthor`), com nota, condição (`CONDITIONS`), comentário, editar (vai para `/acervo/:id/avaliar`) e excluir (`confirm`).

**Avaliar livro (`/acervo/:id/avaliar`)** — nota 1 a 5 (`Rating`), condição do exemplar obrigatória, comentário opcional (até 1000). Se o leitor já avaliou, edita (`reviewsApi.update`); senão cria (`booksApi.review`). Sem retirada do livro, mostra "Avaliação indisponível".

**Favoritos (`/favoritos`)** — `BookGrid` de `BookCard` com botão remover.

**Lista de desejos (`/desejos`)** — tabela com capa, prioridade (`StatusChip kind="priority"`), observação e disponibilidade; editar com `WishlistDialog` e remover com `confirm`. Itens saem da lista automaticamente quando o livro é reservado (regra do backend).

**Notificações (`/notificacoes`)** — abas Todas/Não lidas, tipo via `NOTIFICATION_TYPES`, marcar como lida, marcar todas, remover e "Limpar lidas". Não lidas com fundo destacado.

---

## 8. Testes

- Um arquivo por módulo: `src/modules/<modulo>/<modulo>.test.jsx`, com a API simulada.
- Testes diretos ao ponto: o fluxo principal da tela e a chamada correta à API, sem testar o MUI.

```jsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { favoritesApi } from '../../api';
import { book, pageOf, renderPage } from '../../test/render';
import FavoritesPage from './FavoritesPage';

vi.mock('../../api');

it('remove um favorito', async () => {
  favoritesApi.list.mockResolvedValue(pageOf([{ ...book(), bookId: 'b-1' }]));
  favoritesApi.remove.mockResolvedValue({});
  renderPage(<FavoritesPage />);

  await userEvent.click(await screen.findByRole('button', { name: 'Remover' }));
  await waitFor(() => expect(favoritesApi.remove).toHaveBeenCalledWith('b-1'));
});
```

Helpers em [`src/test/render.jsx`](src/test/render.jsx):

| Helper | Uso |
| --- | --- |
| `renderPage(el, { path, route, user })` | Renderiza com todos os providers. Para rota com parâmetro: `{ path: '/acervo/:id', route: '/acervo/b-1' }` |
| `READER`, `LIBRARIAN` | Usuários logados (padrão: `READER`) |
| `pageOf(results)` | Monta resposta paginada |
| `book(over)`, `rental(over)` | Objetos de exemplo da API |

Dicas com MUI: select é `getByRole('combobox', { name })` + `getByRole('option', { name })`; `Rating` usa `fireEvent.click` no `radio`; use `findBy...` para conteúdo que vem da API; o `localStorage` é limpo após cada teste.

---

## 9. Convenções de código

- Sem comentários óbvios e sem docstrings; nomes claros fazem o papel.
- Textos da interface em português; código (variáveis, funções) em inglês.
- Componentes funcionais, `export default` na página; estado local com hooks (sem Redux).
- Layout com componentes MUI e `sx` (sem CSS separado). Responsivo com breakpoints do `sx` (`{ xs, sm, md }`).
- Cores e fontes vêm do tema ([`theme.js`](src/theme.js)): use `primary.main`, `error.main`, `text.secondary`, `action.hover` etc. Códigos, datas e valores em `fontFamily: 'IBM Plex Mono, monospace'`.
- **MUI 9**: props de input via `slotProps` (`slotProps={{ htmlInput: { maxLength } }}`, `slotProps={{ inputLabel: { shrink: true } }}`), não `inputProps`/`InputLabelProps`. Ícones com sufixo `Outlined` (ex.: `DeleteOutlined`, não `DeleteOutline`); importe cada ícone pelo caminho (`@mui/icons-material/DeleteOutlined`).
- Datas para o usuário sempre via `formatDate`/`formatDateTime` (fuso de São Paulo).

---

## 10. CI e deploy

- **CI**: [`frontend-ci.yml`](../../.github/workflows/frontend-ci.yml) roda `npm ci`, `npm test` e `npm run build` em push/PR para `main`, `develop` ou `master` que altere `src/frontend/`.
- **Docker**: build em duas etapas (Node gera o `dist`, Nginx serve). O [`nginx.conf`](nginx.conf) faz fallback de rotas da SPA para o `index.html`, cache longo em `/assets/` e `no-cache` no `index.html`.
- **Vercel** (quando todas as telas estiverem prontas):
  1. Importar o repositório com **Root Directory** `src/frontend` (framework Vite, saída `dist`).
  2. Definir `VITE_API_URL` em Environment Variables.
  3. Adicionar o domínio gerado em `CORS_ALLOWED_ORIGINS` no Render.
  4. O [`vercel.json`](vercel.json) já redireciona todas as rotas para o `index.html`.
