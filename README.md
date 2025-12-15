# Welcome to your Dyad app

## Estrutura do Projeto

Este projeto é um sistema de gerenciamento de obras com as seguintes funcionalidades principais:

- Dashboard com estatísticas e gráficos
- Registro e gerenciamento de demandas
- Sistema de autenticação de usuários
- Perfis de usuário com avatar
- Configurações do sistema

## Configuração

### Pasta de Uploads

Este projeto está configurado para armazenar imagens localmente na pasta `uploads`. Para configurar corretamente:

1. Crie uma pasta chamada `uploads` na raiz do projeto:
   ```
   mkdir uploads
   ```

2. Certifique-se de que a pasta tenha permissões de leitura e escrita adequadas.

**Nota:** Em um ambiente de produção, você precisará configurar seu servidor web para servir os arquivos dessa pasta como recursos estáticos.

## Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

## Build

Para criar uma versão de produção:

```bash
npm run build
```

## Tecnologias Utilizadas

- React com TypeScript
- Supabase para autenticação e banco de dados
- Tailwind CSS para estilização
- shadcn/ui para componentes
- React Query para gerenciamento de estado assíncrono
- Vite como bundler