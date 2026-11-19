# Storyboard do Demo Day

Roteiro da apresentação e da demonstração ao vivo. Os papéis abaixo são uma **sugestão** baseada na divisão de módulos do README; a equipe deve confirmar.

| Tempo | Momento | O que acontece na tela | Quem fala |
| --- | --- | --- | --- |
| 0:00–0:45 | **Problema** | Foto/número de resíduos agrícolas descartados no Vale do São Francisco | _a definir_ |
| 0:45–1:30 | **Solução e proposta de valor** | Página inicial do Banco de Resíduos | _a definir_ |
| 1:30–4:00 | **Demo ao vivo** (roteiro abaixo) | MVP em duas janelas: João (vendedor) e Fernanda (compradora) | Frontend: João Pedro Carvalho / Kathleen Beatriz Loiola |
| 4:00–4:30 | **Por baixo do capô** | Painel admin com a comissão de 5%; como o aceite atômico evita vender o mesmo lote duas vezes | Backend: Matheus Henrique da Fonseca / Luis Felipe |
| 4:30–5:15 | **Validação e números** | Métricas, leads, resultados dos testes de usabilidade, DRE | Banco/infra: Gustavo Moreira / Kelvin Oliveira / Luana |
| 5:15–6:00 | **Próximos passos e pedido** | Roadmap e edital escolhido | _a definir_ |

## Demonstração ao vivo

1. Fernanda propôs comprar 500 kg de casca de manga do João a R$ 0,30/kg.
2. João abre **Negociações** e faz uma contraproposta.
3. Fernanda aceita, **paga (simulado)** e **confirma a retirada**.
4. Os dois se avaliam; mostrar a reputação no perfil público.
5. Entrar como administração e mostrar a comissão no painel.

## Plano B (se algo falhar ao vivo)

- Rodar `docker compose up --build` antes da apresentação e deixar as janelas já logadas.
- Ter o vídeo de 2 minutos do MVP aberto em outra aba.
- Sem internet, o mapa fica sem imagem de fundo, mas o fluxo funciona.
- `docker compose down -v` + `up` recria os dados de demonstração se o estado ficar bagunçado nos ensaios.
