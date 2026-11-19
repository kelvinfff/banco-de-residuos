# Landing page

Página estática (`index.html`, sem dependências) para captar interessados antes da abertura da plataforma.

## 1. Ligar o formulário ao Google Forms (leads)

1. Crie um Google Forms com 5 perguntas de resposta curta: Nome, Contato, Perfil, Município, Resíduo.
2. No Forms, clique em ⋮ → **Gerar link pré-preenchido**, preencha qualquer coisa e copie o link.
3. No link, cada pergunta aparece como `entry.123456789=...`. Anote o número de cada uma.
4. Em `index.html`, no bloco `FORMULARIO`:
   - `acao`: troque o fim do link do formulário de `/viewform` para `/formResponse`;
   - `campos`: coloque cada `entry.NNN` na pergunta correspondente.
5. Teste enviando um lead: ele aparece na aba **Respostas** do Forms. Esse é o **número de leads** pedido no checkpoint.

## 2. Publicar (GitHub Pages)

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. O workflow `.github/workflows/landing.yml` publica a pasta `landing/` a cada push no `main` que altere essa pasta (ou manualmente, em **Actions → Publicar landing page → Run workflow**).
3. O link fica em `https://<usuario>.github.io/banco-de-residuos/`. Coloque no README e na ficha.

## 3. Contar visitas

O GitHub Pages não mostra visitas. Opções gratuitas:

- **GoatCounter** (goatcounter.com): crie a conta e cole a linha de script que ele fornece antes de `</body>`.
- Ou um encurtador com contagem de cliques no link divulgado.

Registre visitas e leads, com data, na tabela de histórico de [docs/metricas.md](../docs/metricas.md).
