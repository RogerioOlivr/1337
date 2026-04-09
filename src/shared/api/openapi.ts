export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: '1337 API',
    version: '1.0.0',
    description: 'API do e-commerce de camisetas 1337',
  },
  tags: [
    { name: 'Usuários', description: 'Cadastro e autenticação' },
    { name: 'Produtos', description: 'Catálogo de camisetas' },
  ],
  paths: {
    '/api/users': {
      post: {
        tags: ['Usuários'],
        summary: 'Cadastrar usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome', 'email', 'senha'],
                properties: {
                  nome: { type: 'string', minLength: 3, example: 'Roger' },
                  email: { type: 'string', format: 'email', example: 'roger@1337.com' },
                  senha: { type: 'string', minLength: 6, example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuário criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessUsuario' },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          409: { $ref: '#/components/responses/ConflictError' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Usuários'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'senha'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'roger@1337.com' },
                  senha: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login realizado — cookie `session` HttpOnly setado',
            headers: {
              'Set-Cookie': {
                description: 'JWT em cookie HttpOnly',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiSuccess' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            nome: { type: 'string' },
                            email: { type: 'string' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Usuários'],
        summary: 'Logout',
        responses: {
          200: {
            description: 'Cookie apagado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessNull' },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Usuários'],
        summary: 'Perfil do usuário logado',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Dados do usuário autenticado',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiSuccess' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            nome: { type: 'string' },
                            email: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    '/api/produtos': {
      get: {
        tags: ['Produtos'],
        summary: 'Listar produtos',
        responses: {
          200: {
            description: 'Lista de produtos ativos',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiSuccess' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ProdutoSummary' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/api/produtos/{id}': {
      get: {
        tags: ['Produtos'],
        summary: 'Buscar produto por ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', example: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Produto encontrado',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiSuccess' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/ProdutoDetail' },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFoundError' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
      },
    },
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {},
          error: { type: 'null' },
        },
      },
      ApiSuccessNull: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'null' },
          error: { type: 'null' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          data: { type: 'null' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {},
            },
          },
        },
      },
      SuccessUsuario: {
        allOf: [
          { $ref: '#/components/schemas/ApiSuccess' },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  nome: { type: 'string', example: 'Roger' },
                  email: { type: 'string', example: 'roger@1337.com' },
                },
              },
            },
          },
        ],
      },
      ProdutoSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          preco: { type: 'number' },
          imagem: { type: 'string', nullable: true },
          estoque: { type: 'integer' },
        },
      },
      ProdutoDetail: {
        allOf: [
          { $ref: '#/components/schemas/ProdutoSummary' },
          {
            properties: {
              descricao: { type: 'string', nullable: true },
            },
          },
        ],
      },
    },
    responses: {
      ValidationError: {
        description: 'Dados inválidos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              success: false,
              data: null,
              error: { code: 'VALIDATION_ERROR', message: 'Nome deve ter no mínimo 3 caracteres' },
            },
          },
        },
      },
      ConflictError: {
        description: 'Recurso já existe',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              success: false,
              data: null,
              error: { code: 'CONFLICT', message: 'E-mail já cadastrado' },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Recurso não encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              success: false,
              data: null,
              error: { code: 'NOT_FOUND', message: 'Produto não encontrado' },
            },
          },
        },
      },
      UnauthorizedError: {
        description: 'Não autenticado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              success: false,
              data: null,
              error: { code: 'UNAUTHORIZED', message: 'Não autorizado' },
            },
          },
        },
      },
    },
  },
};
