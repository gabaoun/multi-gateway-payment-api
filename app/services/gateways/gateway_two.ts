import axios from 'axios'
import env from '#start/env'
import {
  type PaymentGateway,
  type PaymentRequest,
  type PaymentResponse,
  type RefundResponse,
} from './payment_gateway.js'

export class GatewayTwo implements PaymentGateway {
  public name = 'Gateway 2'
  private baseUrl = env.get('GATEWAY_TWO_URL')
  private token = env.get('GATEWAY_TWO_TOKEN')
  private secret = env.get('GATEWAY_TWO_SECRET')

  public async pay(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transacoes`,
        {
          valor: request.amount,
          nome: request.name,
          email: request.email,
          numeroCartao: request.cardNumber,
          cvv: request.cvv,
        },
        {
          headers: {
            'Gateway-Auth-Token': this.token.release(),
            'Gateway-Auth-Secret': this.secret.release(),
          },
          timeout: 10000,
        }
      )

      return {
        success: true,
        externalId: response.data.id || response.data.external_id,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  public async refund(externalId: string): Promise<RefundResponse> {
    try {
      await axios.post(
        `${this.baseUrl}/transacoes/reembolso`,
        { id: externalId },
        {
          headers: {
            'Gateway-Auth-Token': this.token.release(),
            'Gateway-Auth-Secret': this.secret.release(),
          },
          timeout: 10000,
        }
      )
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }
}
