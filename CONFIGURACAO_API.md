# Configuração da URL da API Backend

## 📍 URLs Atuais

- **Backend**: https://prontivus-clinic-backend.onrender.com
- **Frontend**: https://prontivus-f-pplm.vercel.app

## 🔧 Configuração no Vercel

### Variável de Ambiente Necessária

No dashboard do Vercel, configure a seguinte variável:

```
NEXT_PUBLIC_API_URL=https://prontivus-clinic-backend.onrender.com
```

### Passos:

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `prontivus-f-pplm`
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Configure:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://prontivus-clinic-backend.onrender.com`
   - **Environments**: Marque todas (Production, Preview, Development)
6. Clique em **Save**
7. Faça um novo deploy (ou aguarde o próximo)

## 🔐 Configuração do CORS no Backend

No Render, configure a variável de ambiente `BACKEND_CORS_ORIGINS`:

```
BACKEND_CORS_ORIGINS=https://prontivus-f-pplm.vercel.app,https://prontivus-f-pplm.vercel.app/
```

### Passos no Render:

1. Acesse o dashboard do Render
2. Selecione o serviço: `prontivus-backend`
3. Vá em **Environment**
4. Adicione ou atualize:
   - **Key**: `BACKEND_CORS_ORIGINS`
   - **Value**: `https://prontivus-f-pplm.vercel.app`
5. Salve e reinicie o serviço

## ✅ Verificação

Após configurar ambos:

1. **Frontend**: As requisições devem ir para `https://prontivus-clinic-backend.onrender.com`
2. **Backend**: Deve aceitar requisições de `https://prontivus-f-pplm.vercel.app`

## 🧪 Teste Local

Para desenvolvimento local, crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Este arquivo não deve ser versionado (já está no .gitignore).

