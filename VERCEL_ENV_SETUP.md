# Configuração de Variáveis de Ambiente no Vercel

## URL da API Backend

Para que o frontend aponte para o backend em produção, você precisa configurar a variável de ambiente no Vercel:

### Passo a Passo:

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Selecione o projeto: `prontivus-f-pplm`
3. Vá em **Settings** → **Environment Variables**
4. Adicione a seguinte variável:

   **Name**: `NEXT_PUBLIC_API_URL`
   
   **Value**: `https://prontivus-clinic-backend.onrender.com`
   
   **Environment**: Marque todas as opções (Production, Preview, Development)

5. Clique em **Save**

### Após Configurar:

1. Faça um novo deploy (ou aguarde o próximo deploy automático)
2. O frontend começará a usar o backend em produção

### Verificação:

Após o deploy, você pode verificar se está funcionando:
- Abra o DevTools do navegador (F12)
- Vá na aba **Network**
- Faça login no sistema
- Verifique se as requisições estão indo para `https://prontivus-clinic-backend.onrender.com`

### URLs Configuradas:

- **Backend**: https://prontivus-clinic-backend.onrender.com
- **Frontend**: https://prontivus-f-pplm.vercel.app

### Nota Importante:

O arquivo `.env.production` foi criado como referência, mas o Vercel usa as variáveis de ambiente configuradas no dashboard. Certifique-se de configurar a variável no dashboard do Vercel.

