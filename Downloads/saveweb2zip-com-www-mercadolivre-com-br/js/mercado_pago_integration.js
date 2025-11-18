/**
 * Exemplo de integração Mercado Pago no Frontend
 * Para usar no arquivo finalizar.html
 */

// Configuração do Mercado Pago (use sua chave pública)
const MERCADOPAGO_PUBLIC_KEY = 'SUA_CHAVE_PUBLICA_AQUI'; // Substitua pela sua chave pública

// Inicializar Mercado Pago SDK
const mp = new MercadoPago(MERCADOPAGO_PUBLIC_KEY, {
    locale: 'pt-BR'
});

/**
 * Função para finalizar compra com PIX
 */
async function finalizePurchasePIX() {
    try {
        // Coletar dados do formulário
        const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
        };
        
        // Validar campos
        if (!formData.nome || !formData.email || !formData.telefone) {
            alert('Por favor, preencha todos os campos');
            return;
        }
        
        // Coletar dados do endereço do localStorage
        const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
        
        // Coletar dados do pedido
        const orderData = {
            amount: 149.90, // Valor do produto (pode ser dinâmico)
            description: 'Fritadeira Elétrica Air Fryer WAP Mega Family',
            payment_method: 'pix',
            payer_email: formData.email,
            payer_name: formData.nome,
        };
        
        // Chamar API do backend para criar pagamento
        const response = await fetch('http://localhost:8000/api/payments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const paymentData = await response.json();
        
        if (paymentData.mercado_pago_id && paymentData.qr_code_base64) {
            // Mostrar QR Code PIX
            showPIXQRCode(paymentData.qr_code_base64, paymentData.qr_code);
            
            // Salvar dados do pagamento
            localStorage.setItem('currentPayment', JSON.stringify({
                payment_id: paymentData.id,
                mercado_pago_id: paymentData.mercado_pago_id,
                transaction_id: paymentData.transaction_id,
            }));
            
            // Verificar status do pagamento periodicamente
            checkPaymentStatus(paymentData.mercado_pago_id);
        } else {
            alert('Erro ao criar pagamento PIX. Tente novamente.');
        }
        
    } catch (error) {
        console.error('Erro ao finalizar compra:', error);
        alert('Erro ao processar pagamento. Tente novamente.');
    }
}

/**
 * Função para finalizar compra com Cartão de Crédito
 */
async function finalizePurchaseCreditCard() {
    try {
        // Coletar dados do formulário
        const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
        };
        
        // Validar campos
        if (!formData.nome || !formData.email || !formData.telefone) {
            alert('Por favor, preencha todos os campos');
            return;
        }
        
        // Coletar dados do cartão (você precisará criar um formulário de cartão)
        const cardData = {
            cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            cardholderName: formData.nome,
            cardExpirationMonth: document.getElementById('cardExpirationMonth').value,
            cardExpirationYear: document.getElementById('cardExpirationYear').value,
            securityCode: document.getElementById('securityCode').value,
            installments: parseInt(document.getElementById('installments').value) || 1,
            identificationType: 'CPF',
            identificationNumber: document.getElementById('cpf').value.replace(/\D/g, ''),
        };
        
        // Criar token do cartão usando Mercado Pago SDK
        const tokenResponse = await mp.fields.createCardToken({
            cardNumber: cardData.cardNumber,
            cardholderName: cardData.cardholderName,
            cardExpirationMonth: cardData.cardExpirationMonth,
            cardExpirationYear: cardData.cardExpirationYear,
            securityCode: cardData.securityCode,
            identificationType: cardData.identificationType,
            identificationNumber: cardData.identificationNumber,
        });
        
        if (tokenResponse.error) {
            alert('Erro ao processar cartão: ' + tokenResponse.error.message);
            return;
        }
        
        // Chamar API do backend para criar pagamento
        const orderData = {
            amount: 149.90,
            description: 'Fritadeira Elétrica Air Fryer WAP Mega Family',
            payment_method: 'credit_card',
            payer_email: formData.email,
            payer_name: formData.nome,
            card_token: tokenResponse.id,
            installments: cardData.installments,
        };
        
        const response = await fetch('http://localhost:8000/api/payments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const paymentData = await response.json();
        
        if (paymentData.status === 'approved') {
            // Pagamento aprovado
            alert('Pagamento aprovado! Redirecionando...');
            window.location.href = 'success.html';
        } else if (paymentData.status === 'pending') {
            // Pagamento pendente
            alert('Pagamento pendente. Aguardando confirmação...');
            checkPaymentStatus(paymentData.mercado_pago_id);
        } else {
            alert('Erro ao processar pagamento: ' + (paymentData.error || 'Tente novamente'));
        }
        
    } catch (error) {
        console.error('Erro ao finalizar compra:', error);
        alert('Erro ao processar pagamento. Tente novamente.');
    }
}

/**
 * Função principal para finalizar compra
 */
function handleFinalizePurchase() {
    // Verificar método de pagamento selecionado
    const selectedPayment = document.querySelector('.payment-option.selected');
    
    if (!selectedPayment) {
        alert('Por favor, selecione uma forma de pagamento');
        return;
    }
    
    const paymentMethod = selectedPayment.querySelector('.payment-name').textContent.trim();
    
    if (paymentMethod === 'PIX') {
        finalizePurchasePIX();
    } else if (paymentMethod === 'Cartão de Crédito') {
        finalizePurchaseCreditCard();
    } else {
        alert('Método de pagamento não suportado');
    }
}

/**
 * Mostrar QR Code PIX
 */
function showPIXQRCode(qrCodeBase64, qrCodeText) {
    // Criar modal ou div para exibir QR Code
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 400px;">
            <h2 style="margin-bottom: 16px;">Escaneie o QR Code para pagar</h2>
            <img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code PIX" style="max-width: 100%; margin-bottom: 16px;">
            <p style="margin-bottom: 8px; font-size: 12px; color: #666;">Ou copie o código:</p>
            <input type="text" value="${qrCodeText}" readonly style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid #ddd; border-radius: 4px;">
            <button onclick="copyPIXCode('${qrCodeText}')" style="padding: 8px 16px; background: #3483fa; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 8px;">Copiar código</button>
            <button onclick="this.closest('div').parentElement.remove()" style="padding: 8px 16px; background: #ccc; color: black; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Copiar código PIX
 */
function copyPIXCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert('Código PIX copiado!');
    });
}

/**
 * Verificar status do pagamento
 */
async function checkPaymentStatus(mercadoPagoId) {
    const maxAttempts = 60; // 5 minutos (verificar a cada 5 segundos)
    let attempts = 0;
    
    const interval = setInterval(async () => {
        attempts++;
        
        try {
            const response = await fetch(`http://localhost:8000/api/payments/status/${mercadoPagoId}`);
            const data = await response.json();
            
            if (data.status === 'approved') {
                clearInterval(interval);
                alert('Pagamento aprovado! Redirecionando...');
                window.location.href = 'success.html';
            } else if (data.status === 'rejected') {
                clearInterval(interval);
                alert('Pagamento rejeitado. Tente novamente.');
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                alert('Tempo de espera esgotado. Verifique o status do pagamento mais tarde.');
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
    }, 5000); // Verificar a cada 5 segundos
}

