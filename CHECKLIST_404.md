# ✅ Checklist para Resolver Erro 404

## 🔍 Passo a Passo para Diagnosticar

### 1. Verificar TODAS as Variáveis de Ambiente na Vercel

Certifique-se de que TODAS estas variáveis estão configuradas:

**✅ Obrigatórias (todas devem estar configuradas):**
```
PUSHINPAY_TOKEN=57071|53RpxxhqVpvIqCv9cabBXR39qIayarUCH5N44Dv180331a6f
PUSHINPAY_API_URL=https://api.pushinpay.com.br
NEXT_PUBLIC_SITE_URL=https://www.privacycombrcheckoutluna.shop
NEXT_PUBLIC_BASE_URL=https://www.privacycombrcheckoutluna.shop
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=856032176652340
```

**✅ Importante:**
- Configure para **"Todos os ambientes"** (Production, Preview, Development)
- Após adicionar cada variável, clique em **"Save"**

### 2. Verificar Build na Vercel

1. Acesse: **Deployments** → Último deployment
2. Verifique se o status é **"Ready"** (verde)
3. Se estiver **"Error"** ou **"Building"**, veja os logs:
   - Clique no deployment
   - Veja a aba **"Build Logs"**
   - Procure por erros em vermelho

### 3. Fazer Redeploy Após Configurar Variáveis

**IMPORTANTE:** Após adicionar/alterar variáveis de ambiente, você DEVE fazer um redeploy:

1. Vá em **Deployments**
2. Clique nos **3 pontos** (⋯) do último deployment
3. Selecione **"Redeploy"**
4. Aguarde o build completar (~2-3 minutos)

### 4. Verificar Domínio

1. Vá em **Settings** → **Domains**
2. Verifique se `privacycombrcheckoutluna.shop` está listado
3. Se não estiver, adicione o domínio
4. Configure os registros DNS conforme instruções da Vercel

### 5. Testar URL da Vercel

Antes de testar o domínio customizado, teste a URL da Vercel:
- A URL será algo como: `https://seu-projeto.vercel.app`
- Se funcionar na URL da Vercel mas não no domínio customizado, o problema é DNS

### 6. Verificar Logs de Runtime

1. Vá em **Functions** → **Logs**
2. Procure por erros relacionados a:
   - Variáveis de ambiente não encontradas
   - Erros de inicialização
   - Erros de API

### 7. Verificar Branch

1. Vá em **Settings** → **Git**
2. Verifique se o **Production Branch** está como `master`
3. Certifique-se de que o último commit está no branch `master`

## 🚨 Problemas Comuns

### Problema: "Build Failed"
**Solução:** Veja os logs de build e corrija os erros

### Problema: "Function Error"
**Solução:** Verifique se todas as variáveis de ambiente estão configuradas

### Problema: "404 on custom domain but works on .vercel.app"
**Solução:** Problema de DNS - verifique configuração do domínio

### Problema: "404 on all routes"
**Solução:** 
- Verifique se o build foi bem-sucedido
- Faça um redeploy
- Verifique se `pages/index.js` existe

## 📝 Checklist Rápido

- [ ] Todas as 5 variáveis obrigatórias estão configuradas?
- [ ] Variáveis configuradas para "Todos os ambientes"?
- [ ] Build está com status "Ready" (verde)?
- [ ] Fez redeploy após configurar variáveis?
- [ ] Domínio está configurado na Vercel?
- [ ] Testou a URL `.vercel.app` primeiro?
- [ ] Branch `master` está configurado como Production?

