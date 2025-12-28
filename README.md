# Obra Manager - Sistema de Gestão de Obras

O **Obra Manager** é uma plataforma robusta desenvolvida para centralizar o controle de execução, qualidade e rastreabilidade em canteiros de obras. O sistema oferece visibilidade em tempo real para gestores e agilidade para as equipes de campo.

---

## 🚀 Funcionalidades Principais

### 1. Dashboard Inteligente
Painel central que consolida os principais indicadores da obra:
- **Estatísticas Rápidas**: Total de demandas, pendências atuais, resolvidos e tempo médio de resposta.
- **Gráficos de Análise**: Visualização de demandas por tipo de serviço e por bloco.
- **Controle de Pintura**: Gráficos de status (Em Andamento/Finalizado) e por localização.
- **Progresso Geral**: Barra de progresso baseada na resolução de demandas.

### 2. Gestão de Demandas (Assistência Técnica/Execução)
Controle de problemas ou solicitações de serviço identificadas na obra:
- **Cadastro em Lote**: Permite registrar a mesma demanda para vários apartamentos e blocos simultaneamente.
- **Rastreamento de Imagens**: Opção de anexar fotos para documentação visual.
- **Pendências de Empreiteiro**: Funcionalidade específica para marcar se a demanda depende de um terceiro, permitindo filtrar quem é o responsável pela trava.
- **Fluxo de Status**: Transição simples entre "Pendente" e "Resolvido" com registro de data e autor.

### 3. Medição e Conferência (Qualidade)
Sistema de verificação de serviços executados:
- **Solicitação**: Membros autorizados solicitam a conferência de um serviço (ex: Rejunte Cozinha) para locais específicos.
- **Inspeção**: O conferente avalia se o serviço está "Concluído" ou "Inconcluído".
- **Feedback**: Caso esteja inconcluído, o sistema obriga o registro do que falta para a aprovação.

### 4. Rastreabilidade de Materiais e Processos
- **Cerâmicas**: Registro de lotes de cerâmica por bloco e localização (Aptos, Sacada, Circulação), essencial para reposições futuras e garantias.
- **Pinturas**: Controle detalhado por demão (1ª ou 2ª), pintor responsável e status de entrega por ambiente.
- **Aberturas e Portas**: Rastreamento individual da instalação de janelas e portas, permitindo identificar faltas, correções necessárias ou arremates pendentes.

### 5. Gestão de Funcionários e Performance
- **Cadastro de Vínculo**: Diferenciação entre funcionários próprios (ACPO) e terceirizados.
- **Atribuições**: Designação formal de tarefas para funcionários em locais específicos.
- **Sistema de Avaliação**: Ao finalizar uma tarefa, o gestor avalia o funcionário em 4 critérios: **Velocidade, Qualidade, Limpeza e Organização**.
- **Ranking**: Visualização de médias de performance para identificar os melhores profissionais.

### 6. Sistema de Filtros Avançado
Presente em todas as listas operacionais, os filtros permitem segmentar por:
- Bloco, Apartamento ou Andar.
- Status do serviço ou medição.
- Tipo de serviço ou local específico.
- **Contador em Tempo Real**: O sistema exibe o total de registros encontrados após a aplicação dos filtros.

### 7. Relatórios em PDF
Geração de documentos prontos para impressão ou compartilhamento via WhatsApp/E-mail:
- **Exportação Filtrada**: O PDF gerado contém exatamente os itens exibidos na tela com os filtros atuais.
- **Informações Básicas**: Listagem tabular com Bloco, Apto, Serviço, Status e Responsável.
- **Cabeçalho Personalizado**: Inclui o nome da obra e a data/hora da geração.

### 8. Administração e Configuração
Acesso exclusivo para administradores:
- **Gestão de Usuários**: Cadastro de novos membros e definição de perfis (Admin vs Membro) e permissões de medição.
- **Estrutura da Obra**: Cadastro de Blocos, Cômodos, Tipos de Serviço e Tipos de Porta/Abertura.
- **Parceiros**: Gestão de empresas Empreiteiras e lista de Pintores.
- **Personalização (White Label)**: Alteração do nome do sistema e das imagens de fundo (Login e Dashboard) via URL.

---

## 🛠 Tecnologias Utilizadas

- **Frontend**: React com TypeScript e Vite.
- **Estilização**: Tailwind CSS e componentes shadcn/ui.
- **Banco de Dados & Auth**: Supabase (PostgreSQL).
- **Gerenciamento de Estado**: React Query (Tanstack Query).
- **Relatórios**: jsPDF e jsPDF-AutoTable.
- **Ícones**: Lucide React.

---

## 🎨 Personalização do Ambiente

O sistema suporta **Modo Claro** e **Modo Escuro**, respeitando a preferência do usuário ou do sistema operacional, garantindo conforto visual em ambientes de obra com alta luminosidade ou escritórios.