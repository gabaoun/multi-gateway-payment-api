export interface PaymentRequest {
  amount: number
  name: string
  email: string
  cardNumber: string
  cvv: string
}

export interface PaymentResponse {
  success: boolean
  externalId?: string
  error?: string
}

export interface RefundResponse {
  success: boolean
  error?: string
}

export interface PaymentGateway {
  name: string
  pay(request: PaymentRequest): Promise<PaymentResponse>
  refund(externalId: string): Promise<RefundResponse>
}
