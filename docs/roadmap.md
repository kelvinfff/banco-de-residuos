# Roadmap de escalabilidade

## Etapas de expansão

| Etapa | Alcance | O que entra no produto |
| --- | --- | --- |
| **1. MVP (atual)** | Petrolina/PE e Juazeiro/BA | Anúncios, busca por distância, negociação, pagamento simulado, avaliações, painel admin |
| **2. Operação real no Vale** | Polo Petrolina–Juazeiro e municípios vizinhos | Pagamento real via gateway com split (comissão retida na fonte), notificações por e-mail/WhatsApp, recuperação de senha, publicação em servidor com HTTPS |
| **3. Planos para empresas** | Agroindústrias e cooperativas maiores | Planos pagos (mais anúncios, filtros avançados, relatórios de impacto), anúncios em destaque |
| **4. Logística** | Todo o Vale do São Francisco | Entrada de transportadores, frete calculado na negociação |
| **5. Outros polos agrícolas** | Outras regiões do Nordeste | Catálogo de culturas por região, busca geográfica em PostGIS, fotos em armazenamento de objetos |

## Desafios técnicos para escalar

Já listados em "Limitações conhecidas" no [README](../README.md): busca por distância em memória (migrar para PostGIS), fotos em disco local, ausência de limite por IP e API rodando sem compilação.

## Desafios regulatórios

- **LGPD:** a plataforma guarda nome, e-mail, telefone e localização de usuários. Precisa de política de privacidade, base legal (execução de contrato), opção de excluir a conta e os dados, e registro de quem acessa dados pessoais no painel admin. Hoje telefone e e-mail só aparecem após o negócio fechado, o que já reduz exposição.
- **Resíduos sólidos (Lei 12.305/2010 — PNRS):** alguns resíduos podem exigir licença ambiental de transporte ou destinação. A plataforma deve deixar claro que a responsabilidade é das partes e, mais à frente, pedir documentação para categorias específicas.
- **Intermediação de pagamentos:** ao cobrar com dinheiro real, usar um gateway regulado pelo Banco Central em vez de custodiar valores, e emitir nota fiscal da comissão.
- **Tributação:** definir o enquadramento da empresa (ex.: Simples Nacional) para a receita de comissão.
