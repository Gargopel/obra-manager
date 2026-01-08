# Obra Manager - Sistema de Gestão de Obras

O **Obra Manager** é uma plataforma robusta desenvolvida para centralizar o controle de execução, qualidade e rastreabilidade em canteiros de obras. O sistema oferece visibilidade em tempo real para gestores e agilidade extrema para as equipes de campo, com foco em performance mobile.

---

## 🚀 Funcionalidades Principais

### 1. Dashboard Inteligente e Metas
Painel central que consolida os principais indicadores da obra:
- **Estatísticas em Tempo Real**: Total de demandas, pendências, resolvidos e tempo médio de resposta.
- **Cronogramas de Metas**: Criação de objetivos temporais com escopo específico (blocos, andares ou serviços). Acompanhamento de progresso percentual e alertas de atraso.
- **Gráficos de Análise**: Visualização de demandas por tipo de serviço, blocos e rastreamento de pintura.

### 2. Gestão de Demandas (Assistência Técnica/Execução)
- **Cadastro Flexível**: Registro simples, cadastro massivo em lote (para prédios inteiros) ou checklist por apartamento.
- **Dependências de Serviço**: Sistema inteligente que bloqueia visualmente tarefas que dependem de outras (ex: não permite marcar "Pintura" como resolvida se houver pendência de "Reboque").
- **Documentação Visual**: Anexo de fotos com otimização automática de tamanho para economia de dados.
- **Pendências de Empreiteiro**: Filtro específico para identificar se o bloqueio é interno ou de uma empresa terceirizada.

### 3. Modo de Campo e Offline
- **Sincronização Offline**: Permite registrar demandas mesmo sem internet. Os dados ficam salvos no aparelho e podem ser enviados à nuvem na "Central de Sincronização" assim que houver sinal.
- **QR Codes de Unidade**: Geração e impressão de etiquetas com QR Code para cada apartamento. Ao escanear, o profissional acessa o **Unit Hub**, vendo apenas as demandas, pinturas e cerâmicas daquela unidade específica.

### 4. Medição e Conferência (Qualidade)
- **Fluxo de Aprovação**: Solicitação de conferência por membros autorizados.
- **Inspeção Detalhada**: Avaliação entre "Concluído" ou "Inconcluído" com registro obrigatório de itens faltantes para correção.
- **Notificações**: Alertas automáticos no sistema quando novas medições são solicitadas.

### 5. Rastreabilidade Total
- **Cerâmicas**: Registro detalhado de lotes de piso e revestimento por localização exata, prevenindo erros em futuras reposições.
- **Pinturas**: Controle por demão (1ª e 2ª), pintor responsável e status de entrega.
- **Aberturas e Portas**: Acompanhamento individual da instalação de esquadrias e portas de madeira.

### 6. Relatórios e Performance
- **Exportação em PDF**: Geração de relatórios gerenciais e **Checklists de Campo** prontos para impressão.
- **Ranking de Funcionários**: Avaliação baseada em 4 critérios: **Velocidade, Qualidade, Limpeza e Organização**.

---

## 🛠 Tecnologias e Otimizações

- **Frontend**: React + TypeScript + Vite.
- **Backend & Auth**: Supabase (PostgreSQL).
- **Performance Mobile**: 
  - **Image Transformation**: Redimensionamento de imagens no servidor para carregamento instantâneo.
  - **Zero Input Lag**: Interface otimizada para remover atrasos de toque no celular.
  - **Smart Caching**: Uso de React Query para navegação fluida entre telas sem re-carregamentos desnecessários.
- **Estilização**: Tailwind CSS + shadcn/ui com suporte a **Modo Escuro**.

---

## 🎨 Personalização (White Label)
Administradores podem configurar o nome da obra, o texto do rodapé e as imagens de fundo da tela de login e do painel principal diretamente pela interface de configurações.