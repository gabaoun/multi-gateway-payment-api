import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const MerchantAuthController = () => import('#controllers/merchant_auth_controller')
const TransactionsController = () => import('#controllers/transactions_controller')
const UsersController = () => import('#controllers/users_controller')
const ProductsController = () => import('#controllers/products_controller')
const GatewaysController = () => import('#controllers/gateways_controller')
const ClientsController = () => import('#controllers/clients_controller')

router.get('/', async () => {
  return { status: 'ok', message: 'Multi-Gateway Payment API' }
})

// Public Routes
router.post('/login', [AuthController, 'login'])

// Public checkout endpoint - accepts raw card data, so it's a card-testing
// (carding) target as well as a normal customer flow. Rate-limited per IP
// per OWASP API4, same as the merchant token endpoint.
router
  .post('/purchase', [TransactionsController, 'purchase'])
  .use(middleware.rateLimit(['5', '60']))

// Merchant JWT auth (OAuth2 client-credentials grant) - rate-limited against
// brute-force per OWASP API4 (Unrestricted Resource Consumption)
router
  .post('/merchant/token', [MerchantAuthController, 'token'])
  .use(middleware.rateLimit(['10', '60']))

// Merchant-scoped API surface - stateless JWT + scope check, no session/role guard
router
  .group(() => {
    router.get('/transactions', [TransactionsController, 'index']).as('merchant.transactions.index')
  })
  .prefix('/merchant')
  .use(middleware.jwtAuth())
  .use(middleware.scope(['merchant:read']))

// Private Routes
router
  .group(() => {
    // User CRUD
    router
      .group(() => {
        router.get('/', [UsersController, 'index'])
        router.post('/', [UsersController, 'store'])
        router.get('/:id', [UsersController, 'show'])
        router.put('/:id', [UsersController, 'update'])
        router.delete('/:id', [UsersController, 'destroy'])
      })
      .prefix('/users')
      .use(middleware.role(['ADMIN', 'MANAGER']))

    // Product CRUD
    router
      .group(() => {
        router.get('/', [ProductsController, 'index'])
        router.post('/', [ProductsController, 'store'])
        router.get('/:id', [ProductsController, 'show'])
        router.put('/:id', [ProductsController, 'update'])
        router.delete('/:id', [ProductsController, 'destroy'])
      })
      .prefix('/products')
      .use(middleware.role(['ADMIN', 'MANAGER', 'FINANCE']))

    // Gateway Management
    router
      .group(() => {
        router.get('/', [GatewaysController, 'index'])
        router.put('/:id', [GatewaysController, 'update'])
      })
      .prefix('/gateways')
      .use(middleware.role(['ADMIN']))

    // Clients - PII (name/email), so scoped like /products rather than
    // left open to every authenticated role.
    router
      .group(() => {
        router.get('/', [ClientsController, 'index'])
        router.get('/:id', [ClientsController, 'show'])
      })
      .prefix('/clients')
      .use(middleware.role(['ADMIN', 'MANAGER', 'FINANCE']))

    // Transactions (Purchases) - payment data, same scoping as /clients.
    router
      .group(() => {
        router.get('/', [TransactionsController, 'index']).use(middleware.role(['ADMIN', 'MANAGER', 'FINANCE']))
        router.get('/:id', [TransactionsController, 'show']).use(middleware.role(['ADMIN', 'MANAGER', 'FINANCE']))
        router
          .post('/:id/charge_back', [TransactionsController, 'refund'])
          .use(middleware.role(['ADMIN', 'FINANCE']))
      })
      .prefix('/transactions')
  })
  .use(middleware.auth())
