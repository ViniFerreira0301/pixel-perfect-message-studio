# Prospector de I.A

Painel em português para revisar abordagens comerciais e acompanhar contatos. A abertura do WhatsApp é registrada no painel, mas só você pode confirmar o envio no próprio WhatsApp. Respostas e pedidos de saída são registrados manualmente.

## Credenciais

Em **Configurações do projeto → Secrets**, configure `IA_PROVEDOR` como `openai` ou `gemini` e cadastre a chave correspondente em `IA_CHAVE`. Nunca salve a chave no código, na planilha ou no chat. Cadastre ao menos uma oferta antes de gerar suas mensagens. A geração usa os dados públicos cadastrados da empresa e não consulta nem raspa sites automaticamente.

## Exportar e importar empresas

1. No Apify, use o seu coletor do Google Maps para uma categoria e cidade. Confira se você pode usar comercialmente os dados e retenha apenas informações comerciais necessárias.
2. Abra o resultado da execução e baixe o conjunto de dados em CSV ou Excel (`.xlsx`). O Prospector reconhece `title`, `categoryName`, `city`, `neighborhood`, `phone`, `website`, `totalScore` e `reviewsCount`.
3. Ou monte uma planilha simples com `nome`, `categoria`, `cidade`, `telefone`, `site` e `instagram`. As colunas `bairro`, `nota_google` e `avaliacoes_google` são opcionais.
4. Entre no Prospector, abra **Importar**, escolha o arquivo, confira a prévia e confirme. Duplicatas e telefones incompatíveis aparecem entre os descartes.

O limite inicial é de 20 primeiros contatos por dia no horário de Brasília. Follow-ups vencidos aparecem primeiro; nenhuma mensagem é disparada automaticamente.
