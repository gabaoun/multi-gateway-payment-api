import axios from 'axios'
import env from '#start/env'
import {
  type PaymentGateway,
  type PaymentRequest,
  type PaymentResponse,
  type RefundResponse,
} from './payment_gateway.js'

export class GatewayOne implements PaymentGateway {
  public name = 'Gateway 1'
  private baseUrl = env.get('GATEWAY_ONE_URL')
  private email = env.get('GATEWAY_ONE_EMAIL')
  private token = env.get('GATEWAY_ONE_TOKEN')

  private async getAuthToken() {
    try {
      const { data } = await axios.post(`${this.baseUrl}/login`, {
        email: this.email,
        token: this.token.release(),
      })
      return data.token
    } catch (e) {
      throw new Error('Gateway 1: Falha na autenticação')
    }
  }

  public async pay(req: PaymentRequest): Promise<PaymentResponse> {
    try {
      const token = await this.getAuthToken()
      const { data } = await axios.post(
        `${this.baseUrl}/transactions`,
        {
          amount: req.amount,
          name: req.name,
          email: req.email,
          cardNumber: req.cardNumber,
          cvv: req.cvv,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      return {
        success: true,
        externalId: data.id || data.external_id,
      }
    } catch (e) {
      return {
        success: false,
        error: e.response?.data?.message || e.message,
      }
    }
  }

  public async refund(externalId: string): Promise<RefundResponse> {
    try {
      const token = await this.getAuthToken()
      await axios.post(
        `${this.baseUrl}/transactions/${externalId}/charge_back`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
