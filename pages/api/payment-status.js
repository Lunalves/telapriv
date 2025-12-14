// API Route para consultar status de pagamento (atualizado pelo webhook)
// Este endpoint é consultado pelo frontend em vez de fazer polling na API PushinPay
// FALLBACK: Se não encontrar no cache do webhook, consulta a API PushinPay diretamente

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { transactionId } = req.query;

  if (!transactionId) {
    return res.status(400).json({ 
      error: 'transactionId é obrigatório',
      message: 'Forneça o transactionId como query parameter: ?transactionId=xxx'
    });
  }

  try {
    // Inicializar cache se não existir
    if (typeof global.paymentStatus === 'undefined') {
      global.paymentStatus = {};
    }

    // PRIMEIRO: Verificar se o status está no cache (atualizado pelo webhook)
    const cachedStatus = global.paymentStatus[transactionId];

    if (cachedStatus && cachedStatus.confirmed) {
      console.log(`✅ Status confirmado encontrado no cache (webhook) para ${transactionId}:`, cachedStatus.status);
      
      return res.status(200).json({
        success: true,
        source: 'webhook',
        ...cachedStatus
      });
    }

    // SEGUNDO: SEMPRE consultar API PushinPay como fallback (cache não persiste no Vercel serverless)
    // Isso garante que mesmo se o webhook atualizou mas o cache não persistiu, ainda detectamos o pagamento
    console.log(`🔍 Consultando API PushinPay para ${transactionId} (cache não tem confirmação ou não persistiu)...`);
    
    const apiToken = process.env.PUSHINPAY_TOKEN;
    if (!apiToken) {
      console.warn('⚠️ PUSHINPAY_TOKEN não configurado - retornando pending');
      return res.status(200).json({
        success: true,
        source: 'fallback',
        status: 'pending',
        confirmed: false,
        message: 'Aguardando confirmação'
      });
    }

    // Tentar consultar a API PushinPay - tentar múltiplos endpoints e formatos de ID
    const apiBaseUrl = 'https://api.pushinpay.com.br/api';
    
    // Normalizar transactionId (pode vir em diferentes formatos)
    const idsParaTentar = [
      transactionId,
      transactionId.toUpperCase(),
      transactionId.toLowerCase()
    ];
    
    const endpointsPossiveis = [];
    idsParaTentar.forEach(id => {
      endpointsPossiveis.push(
        { path: `/transaction/${id}`, method: 'GET', id: id },
        { path: `/pix/transaction/${id}`, method: 'GET', id: id },
        { path: `/pix/${id}`, method: 'GET', id: id },
        { path: `/pix/transaction/${id}`, method: 'POST', id: id },
        { path: `/transaction/${id}`, method: 'POST', id: id }
      );
    });
    
    // Adicionar endpoint genérico de status
    endpointsPossiveis.push({ path: `/pix/status`, method: 'POST', id: transactionId });

    for (const endpointConfig of endpointsPossiveis) {
      try {
        const url = `${apiBaseUrl}${endpointConfig.path}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos por endpoint

        const fetchOptions = {
          method: endpointConfig.method,
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        };

        // Se for POST, adicionar body
        const idParaUsar = endpointConfig.id || transactionId;
        if (endpointConfig.method === 'POST' && endpointConfig.path === '/pix/status') {
          fetchOptions.headers['Content-Type'] = 'application/json';
          fetchOptions.body = JSON.stringify({ id: idParaUsar });
        } else if (endpointConfig.method === 'POST') {
          fetchOptions.headers['Content-Type'] = 'application/json';
          fetchOptions.body = JSON.stringify({ 
            transaction_id: idParaUsar,
            id: idParaUsar,
            transactionId: idParaUsar
          });
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        console.log(`📥 Resposta ${endpointConfig.method} ${endpointConfig.path}:`, response.status);

        if (response.status === 200) {
          const statusData = await response.json();
          
          console.log(`📊 Dados recebidos da API PushinPay:`, JSON.stringify(statusData, null, 2));
          
          // Extrair status de múltiplos campos
          let status = (statusData.status || statusData.payment_status || statusData.state || 'pending')?.toLowerCase();
          const hasPaidAt = statusData.paid_at || statusData.payment_date || statusData.paidAt;
          const hasEndToEndId = statusData.end_to_end_id; // Se tiver end_to_end_id, foi pago
          
          // Se tiver paid_at ou end_to_end_id, considerar como pago
          if ((hasPaidAt || hasEndToEndId) && (status === 'pending' || status === 'created')) {
            console.log(`🔍 Detectado paid_at ou end_to_end_id - considerando como pago`);
            status = 'paid';
          }

          const isPaid = status === 'paid' || status === 'approved' || status === 'confirmed' || status === 'pago' || hasPaidAt || hasEndToEndId;

          console.log(`📊 Status final para ${transactionId}:`, status, isPaid ? '✅ (PAGO!)' : '⏳ (pendente)');

          // Salvar no cache para próximas consultas (mesmo que não persista, tenta)
          if (isPaid) {
            global.paymentStatus[transactionId] = {
              status: 'paid',
              confirmed: true,
              confirmedAt: new Date().toISOString(),
              amount: statusData.value || statusData.amount,
              paidAt: hasPaidAt,
              endToEndId: hasEndToEndId,
              source: 'api-fallback',
              originalStatus: status,
              data: statusData
            };
            console.log(`💾 Status salvo no cache:`, global.paymentStatus[transactionId]);
          }

          return res.status(200).json({
            success: true,
            source: 'api-fallback',
            status: isPaid ? 'paid' : status,
            confirmed: isPaid,
            amount: statusData.value || statusData.amount,
            paidAt: hasPaidAt,
            endToEndId: hasEndToEndId,
            data: statusData
          });
        } else if (response.status === 404) {
          // 404 é esperado - transação pode não estar disponível ainda
          console.log(`⚠️ Endpoint ${endpointConfig.path} retornou 404 - tentando próximo...`);
          continue;
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          console.log(`⏱️ Timeout ao consultar ${endpointConfig.path}`);
        } else {
          console.log(`⚠️ Erro ao consultar ${endpointConfig.path}:`, fetchError.message);
        }
        continue;
      }
    }

    // Se nenhum endpoint funcionou, retornar pending
    console.log(`⏳ Nenhum endpoint da API funcionou para ${transactionId} - retornando pending`);
    
    return res.status(200).json({
      success: true,
      source: 'fallback',
      status: 'pending',
      confirmed: false,
      message: 'Aguardando confirmação via webhook ou API'
    });

  } catch (error) {
    console.error('❌ Erro ao consultar status:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao consultar status de pagamento'
    });
  }
}

