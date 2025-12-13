# 🔐 Variáveis de Ambiente para Vercel

## Variáveis Obrigatórias

Configure estas variáveis no painel da Vercel (Settings → Environment Variables):

### PushinPay (Obrigatório)
```
PUSHINPAY_TOKEN=57071|53RpxxhqVpvIqCv9cabBXR39qIayarUCH5N44Dv180331a6f
PUSHINPAY_API_URL=https://api.pushinpay.com.br
```

### Next.js (Públicas)
```
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_BASE_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=856032176652340
```

## Variáveis Opcionais

### PushinPay
```
PUSHINPAY_REDIRECT_URL=https://privacycombrcheckoutluna.shop
PUSHINPAY_SPLIT_RULES=[{"account_id":"uuid-conta-1","value":10}]
```

### Telegram (Opcional)
```
TELEGRAM_BOT_TOKEN=seu_bot_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui
```

## 📋 Como Configurar na Vercel

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável:
   - **Key**: Nome da variável (ex: `PUSHINPAY_TOKEN`)
   - **Value**: Valor da variável
   - **Environment**: Selecione Production, Preview e Development
4. Clique em **Save**
5. Faça um novo deploy para aplicar as mudanças

## ⚠️ Importante

- **Nunca** commite o arquivo `.env.local` no Git
- Use variáveis de ambiente na Vercel para valores sensíveis
- `NEXT_PUBLIC_*` são variáveis públicas (acessíveis no cliente)
- Variáveis sem `NEXT_PUBLIC_` são apenas no servidor (mais seguras)

