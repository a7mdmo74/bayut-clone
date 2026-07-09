// Basic OpenAPI schema for the Bayut Clone API
// This provides a foundation for API documentation
// Note: This is a hand-written OpenAPI schema. For production, consider using
// zod-to-openapi to auto-generate from your Zod schemas.

export const openApiSchema = {
  openapi: '3.0.0',
  info: {
    title: 'Bayut Clone API',
    version: '0.1.0',
    description: 'A real estate marketplace API for property listings, favorites, saved searches, and lead management',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string', minLength: 1 },
                  lastName: { type: 'string', minLength: 1 },
                  phone: { type: 'string', minLength: 7 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/properties': {
      get: {
        summary: 'Search properties',
        tags: ['Properties'],
        parameters: [
          { name: 'listingType', in: 'query', schema: { type: 'string', enum: ['SALE', 'RENT'] } },
          { name: 'propertyType', in: 'query', schema: { type: 'string', enum: ['APARTMENT', 'VILLA', 'TOWNHOUSE', 'PENTHOUSE', 'STUDIO', 'OFFICE', 'RETAIL', 'WAREHOUSE', 'LAND', 'BUILDING'] } },
          { name: 'communityId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'bedrooms', in: 'query', schema: { type: 'number' } },
          { name: 'bathrooms', in: 'query', schema: { type: 'number' } },
          { name: 'keyword', in: 'query', schema: { type: 'string' } },
          { name: 'furnished', in: 'query', schema: { type: 'boolean' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc'] } },
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Properties retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array' },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        total: { type: 'number' },
                        totalPages: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/favorites': {
      get: {
        summary: 'Get user favorites',
        tags: ['Favorites'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Favorites retrieved successfully',
          },
        },
      },
      post: {
        summary: 'Add property to favorites',
        tags: ['Favorites'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'propertyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '201': {
            description: 'Property added to favorites',
          },
        },
      },
      delete: {
        summary: 'Remove property from favorites',
        tags: ['Favorites'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'propertyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': {
            description: 'Property removed from favorites',
          },
        },
      },
    },
    '/saved-searches': {
      get: {
        summary: 'Get user saved searches',
        tags: ['Saved Searches'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Saved searches retrieved successfully',
          },
        },
      },
      post: {
        summary: 'Create saved search',
        tags: ['Saved Searches'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'filters'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 100 },
                  filters: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Saved search created successfully',
          },
        },
      },
    },
    '/leads': {
      post: {
        summary: 'Submit a lead',
        tags: ['Leads'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['propertyId', 'name', 'email', 'phone'],
                properties: {
                  propertyId: { type: 'string', format: 'uuid' },
                  name: { type: 'string', minLength: 1, maxLength: 100 },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string', minLength: 7 },
                  message: { type: 'string', maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Lead submitted successfully',
          },
        },
      },
    },
    '/locations/emirates': {
      get: {
        summary: 'Get all emirates',
        tags: ['Locations'],
        responses: {
          '200': {
            description: 'Emirates retrieved successfully',
          },
        },
      },
    },
    '/locations/emirates/{emirateId}/communities': {
      get: {
        summary: 'Get communities in an emirate',
        tags: ['Locations'],
        parameters: [
          { name: 'emirateId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Communities retrieved successfully',
          },
        },
      },
    },
    '/amenities': {
      get: {
        summary: 'Get all amenities',
        tags: ['Amenities'],
        responses: {
          '200': {
            description: 'Amenities retrieved successfully',
          },
        },
      },
    },
    '/admin/users': {
      get: {
        summary: 'Get all users (admin only)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Users retrieved successfully',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
}
