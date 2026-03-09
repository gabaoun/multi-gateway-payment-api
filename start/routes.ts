import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const TransactionsController = () => import('#controllers/transactions_controller')
const UsersController = () => import('#controllers/users_controller')
const ProductsController = () => import('#controllers/products_controller')
const GatewaysController = () => import('#controllers/gateways_controller')
const ClientsController = () => import('#controllers/clients_controller')

router.get('/', async () => {
  return { status: 'ok', message: 'BeTalent API' }
})

// Public Routes
router.post('/login', [AuthController, 'login'])
router.post('/purchase', [TransactionsController, 'purchase'])

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

    // Clients
    router
      .group(() => {
        router.get('/', [ClientsController, 'index'])
        router.get('/:id', [ClientsController, 'show'])
      })
      .prefix('/clients')

    // Transactions (Purchases)
    router
      .group(() => {
        router.get('/', [TransactionsController, 'index'])
        router.get('/:id', [TransactionsController, 'show'])
        router
          .post('/:id/charge_back', [TransactionsController, 'refund'])
          .use(middleware.role(['ADMIN', 'FINANCE']))
      })
      .prefix('/transactions')
  })
  .use(middleware.auth())
