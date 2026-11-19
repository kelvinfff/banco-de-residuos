# DRE simplificado e precificação

> **Tudo aqui é projeção com premissas.** Nenhum número é resultado real. Troquem as premissas pelos valores que a equipe validar (preço do VPS que vão usar, ticket médio ouvido nas entrevistas etc.) e recalculem.

## Precificação

| Fonte de receita | Preço | Quem paga | Quando entra |
| --- | --- | --- | --- |
| **Comissão por transação** | 5% do valor negociado (já implementado no MVP, `COMISSAO_BPS=500`) | Vendedor (descontado do valor que recebe) | Desde o mês 1 |
| **Plano para empresas** | R$ 79/mês: mais anúncios, filtros avançados, relatório de impacto | Agroindústrias e cooperativas | A partir do mês 7 |
| Anúncio em destaque | A definir | Vendedor | Ano 2 (fora desta projeção) |
| Doações (preço zero) | Grátis | — | Sempre: atraem oferta e geram impacto ambiental |

## Premissas

| Premissa | Valor | Por quê | Fonte / situação |
| --- | --- | --- | --- |
| Ticket médio por transação | R$ 600 | Ex.: 2 t de casca/bagaço a R$ 0,30/kg | **Sem fonte ainda: hipótese da equipe.** Validar o preço por kg e o volume por retirada nas entrevistas com vendedores e compradores |
| Transações por mês | 5 no mês 1 → 110 no mês 12 | Crescimento por visitas a agroindústrias de Petrolina e Juazeiro | Hipótese da equipe; comparar com as métricas reais (`metricas.md`) a cada mês |
| Assinantes do plano empresa | 2 no mês 7 → 12 no mês 12 | Conversão das empresas que já vendem com frequência | Hipótese da equipe |
| Taxa do gateway de pagamento | 1% do volume | Pix em gateways com split fica entre ~0,5% e ~1,2% | Mercado Pago: 0,49% a 0,99% no Pix ([blog Mercado Pago](https://www.mercadopago.com.br/blog/evitar-cobranca-taxa-pix)); Pagar.me: a partir de 1,19% ([comparativo NFE.io](https://nfe.io/blog/pagamentos/gateway-pagamento-mais-barato/)); Asaas: R$ 0,99 fixo por Pix ([tabela Asaas](https://www.asaas.com/precos-e-taxas)). Consultado em 19/11/2026 |
| Impostos | 6% da receita | Simples Nacional, Anexo III, 1ª faixa (até R$ 180 mil/ano) | Tabela do Anexo III ([Conta Azul](https://contaazul.com/blog/anexo-3-simples-nacional/); base legal: LC 123/2006). **Atenção:** o Anexo III exige Fator R ≥ 28% (folha ÷ receita). Sem pró-labore, a empresa cairia no Anexo V (15,5%); ver sensibilidade abaixo. Confirmar o enquadramento da atividade com contador |
| Cloud (servidor + banco + backup) | R$ 150/mês | Um VPS com 8 GB roda o `docker compose` do MVP; o resto cobre backup e armazenamento de fotos | VPS Hostinger KVM 2 (8 GB): ~R$ 43/mês no contrato de 24 meses, renovação a R$ 77,99/mês ([Hostinger](https://www.hostinger.com/br/vps/hospedagem-ubuntu)). Consultado em 19/11/2026 |
| Domínio | R$ 5/mês | ~R$ 60/ano | Domínio `.com.br` no [Registro.br](https://registro.br/) custa cerca de R$ 40/ano; o valor usado tem folga |
| Marketing | R$ 600/mês | Deslocamento para visitas, material impresso, anúncios locais | Estimativa da equipe; sem orçamento formal |
| Contador | R$ 250/mês a partir do mês 7 | Quando abrir CNPJ para receber via gateway | Estimativa; pedir orçamento a um escritório de Petrolina |
| **Equipe** | **R$ 0 (sem pró-labore no ano 1)** | Fundadores estudantes. Se cada um dos 7 tirasse R$ 1.000/mês, o custo anual subiria R$ 84.000 e o projeto precisaria de fomento ou investimento | Decisão da equipe |

## Projeção de 12 meses (R$)

| Mês | Transações | Volume negociado (GMV) | Comissão 5% | Planos empresa | **Receita** | Impostos (6%) | Gateway (1% do GMV) | Custos fixos | **Resultado** | Acumulado |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 5 | R$ 3.000 | R$ 150 | R$ 0 | **R$ 150** | R$ 9 | R$ 30 | R$ 755 | **R$ -644** | R$ -644 |
| 2 | 8 | R$ 4.800 | R$ 240 | R$ 0 | **R$ 240** | R$ 14 | R$ 48 | R$ 755 | **R$ -577** | R$ -1.221 |
| 3 | 12 | R$ 7.200 | R$ 360 | R$ 0 | **R$ 360** | R$ 22 | R$ 72 | R$ 755 | **R$ -489** | R$ -1.710 |
| 4 | 16 | R$ 9.600 | R$ 480 | R$ 0 | **R$ 480** | R$ 29 | R$ 96 | R$ 755 | **R$ -400** | R$ -2.110 |
| 5 | 22 | R$ 13.200 | R$ 660 | R$ 0 | **R$ 660** | R$ 40 | R$ 132 | R$ 755 | **R$ -267** | R$ -2.376 |
| 6 | 28 | R$ 16.800 | R$ 840 | R$ 0 | **R$ 840** | R$ 50 | R$ 168 | R$ 755 | **R$ -133** | R$ -2.510 |
| 7 | 36 | R$ 21.600 | R$ 1.080 | R$ 158 | **R$ 1.238** | R$ 74 | R$ 216 | R$ 1.005 | **R$ -57** | R$ -2.567 |
| 8 | 45 | R$ 27.000 | R$ 1.350 | R$ 237 | **R$ 1.587** | R$ 95 | R$ 270 | R$ 1.005 | **R$ 217** | R$ -2.350 |
| 9 | 55 | R$ 33.000 | R$ 1.650 | R$ 395 | **R$ 2.045** | R$ 123 | R$ 330 | R$ 1.005 | **R$ 587** | R$ -1.763 |
| 10 | 70 | R$ 42.000 | R$ 2.100 | R$ 553 | **R$ 2.653** | R$ 159 | R$ 420 | R$ 1.005 | **R$ 1.069** | R$ -694 |
| 11 | 90 | R$ 54.000 | R$ 2.700 | R$ 711 | **R$ 3.411** | R$ 205 | R$ 540 | R$ 1.005 | **R$ 1.661** | R$ 967 |
| 12 | 110 | R$ 66.000 | R$ 3.300 | R$ 948 | **R$ 4.248** | R$ 255 | R$ 660 | R$ 1.005 | **R$ 2.328** | R$ 3.295 |
| **Ano 1** | 497 | R$ 298.200 | R$ 14.910 | R$ 3.002 | **R$ 17.912** | R$ 1.075 | R$ 2.982 | R$ 10.560 | **R$ 3.295** | |

## Leitura dos números

- **Ponto de equilíbrio:** cada R$ 100 negociados deixam R$ 3,70 para a plataforma (5% de comissão, menos impostos e gateway). Com custos fixos de R$ 1.005/mês, o equilíbrio está em **cerca de R$ 27 mil negociados por mês (~45 transações de R$ 600)**, alcançado no mês 8 da projeção.
- **O lucro do ano 1 só existe porque a equipe não recebe.** É o ponto a deixar claro para a banca.
- **Ticket baixo é o maior risco.** Resíduo vale pouco por kg; a receita depende de volume (agroindústrias que vendem toneladas com frequência) e dos planos para empresas.
- Sensibilidade: com ticket médio de R$ 300 em vez de R$ 600, o ano 1 fecha em prejuízo (receita R$ 10.457 − impostos R$ 627 − gateway R$ 1.491 − fixos R$ 10.560 = **R$ −2.221**).
- Sensibilidade de imposto: se a empresa cair no Anexo V (15,5%, por não ter folha de pagamento), os impostos do ano 1 vão de R$ 1.075 para R$ 2.776 e o resultado cai de R$ 3.295 para **R$ 1.594**. Continua positivo, mas o equilíbrio fica mais distante.
