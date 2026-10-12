# TechFlow Dashboard — Checkpoint 5 (FrontEnd Design)

Dashboard responsivo da empresa fictícia **TechFlow** para acompanhar projetos, equipes e indicadores, desenvolvido com **HTML + Tailwind CSS + JavaScript puro**.

## 👥 Integrantes

| Nome | RM |
|------|----|
| Enzo Eccheli Abolis | RM570918 |

## 🔗 Link do GitHub

_https://github.com/usuario/techflow-dashboard_

## 🛠️ Tecnologias utilizadas

- **HTML5** semântico (`header`, `aside`, `main`, `section`, `article`, `fieldset`)
- **Tailwind CSS v3** via Play CDN, configurado com `darkMode: 'class'` e uma paleta própria (`brand`)
- **JavaScript puro** (ES6+), sem bibliotecas
- **CSS** complementar (`css/styles.css`) para scrollbar, animações customizadas e `prefers-reduced-motion`
- Fonte **Plus Jakarta Sans** (Google Fonts)

## 📁 Estrutura

```
techflow-dashboard/
│
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── README.md
```

## ▶️ Como executar

Basta abrir o `index.html` no navegador (é necessário estar online, pois o Tailwind e a fonte são carregados por CDN). Se preferir, use a extensão **Live Server** do VS Code.

## ✨ Principais recursos implementados

### Dashboard (desktop e mobile)
- **Navbar** fixa com botão do menu mobile, campo de pesquisa, seletor de tema, notificações e informações do usuário.
- **Sidebar** com navegação, badges de contagem, lista de equipes e card com botão desabilitado ("Exportar PDF — em breve").
- **4 cards de indicadores**: Projetos ativos, Projetos concluídos, Tarefas pendentes e Equipes.
- **7 cards de projetos** em CSS Grid com tamanhos diferentes:
  - *Portal do Cliente 2.0* → `sm:col-span-2 xl:row-span-2` (destaque)
  - *Migração para Cloud* → `xl:row-span-2` (card alto com checklist)
  - *Dashboard de BI* → `sm:col-span-2` (card largo com mini gráfico)
  - Demais cards ocupando 1 célula; `grid-flow-row-dense` preenche os espaços.
- **Feed de atividades** recentes e painel de **carga das equipes**.

### Tela/Modal de Novo Projeto
- Campos: Nome, Responsável, Categoria, Prioridade, Prazo e Descrição.
- **Validação visual com JavaScript**: cada campo é validado ao perder o foco e, depois, em tempo real. Estados de **erro** (borda vermelha + mensagem) e **sucesso** (borda verde + mensagem), aplicados via `data-state` e variantes `data-[state=error]:` / `data-[state=success]:` do Tailwind.
- Regras: nome com no mínimo 3 caracteres, prazo não pode estar no passado, descrição com no mínimo 20 caracteres (com contador 0/300).
- Ao enviar com erros: alerta no topo, animação de "shake" e foco no primeiro campo inválido.
- Ao enviar com sucesso: botão fica `disabled` com spinner ("Salvando…"), o projeto é adicionado ao grid (sem banco de dados), os contadores são atualizados e um toast confirma a criação.
- No celular o modal abre como *bottom sheet*; a partir de `sm:` fica centralizado.

### Interações
- Dropdown do usuário (fecha com clique fora e `Esc`, navegação por setas).
- Menu mobile da Sidebar com overlay, bloqueio de scroll e `inert` quando fechada.
- Estados `hover:`, `focus:` / `focus-visible:`, `active:` e `disabled:` em botões, links e inputs.
- `group-hover:` nos cards (ícones giram, setas aparecem, barras do gráfico mudam de cor, linha inferior dos indicadores).
- `peer-checked:` nos filtros de categoria, nas opções de prioridade do formulário e no checklist (tarefa riscada).
- `peer-disabled:` no item bloqueado do checklist.
- Busca de projetos em tempo real (ignora acentos) combinada com o filtro por categoria, com estado vazio.
- Atalhos: `/` ou `Ctrl+K` focam a busca; `Esc` fecha modal, dropdown ou sidebar.

### Tema Light | Dark | System
- Seletor na navbar (tablet/desktop) e dentro do dropdown (celular).
- Usa a variante `dark:` do Tailwind através da classe `.dark` no `<html>`.
- No modo **System** segue `prefers-color-scheme` e reage em tempo real quando o sistema troca de tema.
- Preferência salva no **localStorage** (`techflow-theme`) e sincronizada entre abas.
- Um script no `<head>` aplica o tema antes da renderização, evitando o "flash" de tema errado.

## 📐 Conceitos obrigatórios aplicados

| Conceito | Onde aparece |
|---|---|
| **Flexbox** (`flex`, `flex-col`, `items-center`, `justify-between`, `flex-wrap`, `gap-*`) | Navbar, sidebar, cabeçalhos de seção, filtros, cards |
| **Grid** (`grid`, `grid-cols-*`, `col-span-*`, `row-span-*`, `gap-*`) | Indicadores, grid de projetos, formulário, feed + equipes |
| **Responsividade** (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) | Mobile-first em todo o layout; `2xl:` amplia a largura máxima e o padding |
| **Estados** (`hover:`, `focus:`, `active:`, `disabled:`, `group-hover:`) | Botões, links, inputs, cards |
| **Transições** (`transition`, `transition-all`, `duration-*`, `ease-*`) | Sidebar, dropdown, modal, toast, cards, botões |
| **Dark Mode** (`dark:`) | Todos os componentes |

### Comportamento por tamanho de tela
- 📱 **Celular**: 1 coluna, sidebar escondida (abre pelo botão ☰), tema no dropdown, modal como bottom sheet.
- 💻 **Tablet/Notebook** (`sm:`/`md:`/`lg:`): 2 colunas no grid, seletor de tema na navbar; em `lg:` a sidebar aparece fixa.
- 🖥️ **Desktop** (`xl:`/`2xl:`): grid de 4 colunas com cards de tamanhos diferentes e rótulos completos no seletor de tema.

## 🧗 Dificuldades encontradas

- **Animar abrir/fechar só com classes do Tailwind**: como o Play CDN gera as classes a partir do HTML, trocar classes pelo JavaScript podia gerar classes que não existiam no CSS. A solução foi usar atributos (`data-open`, `data-state`, `aria-pressed`) e as variantes `data-[...]:` e `aria-*:` do Tailwind, deixando o JS só alterar atributos.
- **Modo System do tema**: não bastava ler a preferência uma vez; foi preciso ouvir o evento `change` do `matchMedia('(prefers-color-scheme: dark)')` e evitar o "flash" de tema claro aplicando a classe `.dark` antes do carregamento da página.
- **Grid com cards de tamanhos diferentes**: com `col-span` e `row-span` sobravam buracos no layout; o `grid-flow-row-dense` resolveu o encaixe.
- **Especificidade no dark mode**: a borda de erro sumia no tema escuro porque `dark:border-*` tinha a mesma especificidade da variante de estado. Foi necessário repetir o estado com `dark:data-[state=error]:`.
- **Acessibilidade da sidebar e do modal**: garantir que o foco do teclado não "fugisse" para elementos escondidos (uso de `inert` e focus trap no modal).
