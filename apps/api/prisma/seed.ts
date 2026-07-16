import {
  PrismaClient,
  Prisma,
  UserRole,
  PropertyType,
  ListingType,
  ListingStatus,
  RentFrequency,
  LeadStatus,
  PlanInterval,
  PaymentProvider,
  PaymentStatus,
  PaymentPurpose,
  SubscriptionStatus,
  ViewingStatus,
  DepositStatus,
} from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { randomUUID } from 'crypto'

import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const PASSWORD = 'password123'
const DEPOSIT_AMOUNT = 100

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
  'https://images.unsplash.com/photo-1600047509807-ba8f88d28df1',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0',
  'https://images.unsplash.com/photo-1605276374104-de6862b9b2a2',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
]

const PROPERTY_TYPES = [
  PropertyType.APARTMENT,
  PropertyType.VILLA,
  PropertyType.TOWNHOUSE,
  PropertyType.PENTHOUSE,
  PropertyType.STUDIO,
  PropertyType.OFFICE,
  PropertyType.RETAIL,
  PropertyType.WAREHOUSE,
  PropertyType.LAND,
  PropertyType.BUILDING,
] as const

const PROPERTY_COUNT = 120
const LEAD_COUNT = 24

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function daysFromNow(days: number, hour = 14) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date
}

async function upsertPlan(input: {
  name: string
  interval: PlanInterval
  priceAed: number
  maxListings: number
  maxFeatured: number
}) {
  const existing = await prisma.plan.findFirst({ where: { name: input.name } })
  if (existing) return existing

  return prisma.plan.create({
    data: {
      name: input.name,
      interval: input.interval,
      priceAed: new Prisma.Decimal(input.priceAed),
      maxListings: input.maxListings,
      maxFeatured: input.maxFeatured,
      isActive: true,
    },
  })
}

async function upsertUser(input: {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  passwordHash: string
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      isVerified: true,
      isActive: true,
    },
    create: {
      email: input.email,
      password: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      isVerified: true,
      isActive: true,
    },
  })
}

async function createPayment(input: {
  userId: string
  purpose: PaymentPurpose
  amountAed: number
  status: PaymentStatus
  metadata?: Record<string, unknown>
  subscriptionId?: string
  providerRef?: string
}) {
  const providerRef = input.providerRef ?? `seed-${input.purpose.toLowerCase()}-${randomUUID()}`
  const idempotencyKey = randomUUID()

  return prisma.payment.create({
    data: {
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      provider: PaymentProvider.STRIPE,
      purpose: input.purpose,
      amountAed: new Prisma.Decimal(input.amountAed),
      status: input.status,
      providerRef,
      idempotencyKey,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  })
}

async function main() {
  console.log('🌱 Starting seed...')

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  const emirates = await Promise.all([
    prisma.emirate.upsert({
      where: { name: 'Dubai' },
      update: {},
      create: { name: 'Dubai', slug: 'dubai' },
    }),
    prisma.emirate.upsert({
      where: { name: 'Abu Dhabi' },
      update: {},
      create: { name: 'Abu Dhabi', slug: 'abu-dhabi' },
    }),
    prisma.emirate.upsert({
      where: { name: 'Sharjah' },
      update: {},
      create: { name: 'Sharjah', slug: 'sharjah' },
    }),
    prisma.emirate.upsert({
      where: { name: 'Ajman' },
      update: {},
      create: { name: 'Ajman', slug: 'ajman' },
    }),
    prisma.emirate.upsert({
      where: { name: 'Ras Al Khaimah' },
      update: {},
      create: { name: 'Ras Al Khaimah', slug: 'ras-al-khaimah' },
    }),
  ])

  const [dubai, abuDhabi, sharjah, ajman, rak] = emirates

  const communityDefs = [
    { name: 'Dubai Marina', slug: 'dubai-marina', emirateId: dubai.id },
    { name: 'Downtown Dubai', slug: 'downtown-dubai', emirateId: dubai.id },
    { name: 'Jumeirah Beach Residence', slug: 'jbr', emirateId: dubai.id },
    { name: 'Business Bay', slug: 'business-bay', emirateId: dubai.id },
    { name: 'Palm Jumeirah', slug: 'palm-jumeirah', emirateId: dubai.id },
    { name: 'Jumeirah Village Circle', slug: 'jvc', emirateId: dubai.id },
    { name: 'Arabian Ranches', slug: 'arabian-ranches', emirateId: dubai.id },
    { name: 'Dubai Hills Estate', slug: 'dubai-hills-estate', emirateId: dubai.id },
    { name: 'Meydan', slug: 'meydan', emirateId: dubai.id },
    { name: 'Dubai Silicon Oasis', slug: 'dubai-silicon-oasis', emirateId: dubai.id },
    { name: 'Saadiyat Island', slug: 'saadiyat-island', emirateId: abuDhabi.id },
    { name: 'Al Reem Island', slug: 'al-reem-island', emirateId: abuDhabi.id },
    { name: 'Yas Island', slug: 'yas-island', emirateId: abuDhabi.id },
    { name: 'Khalifa City', slug: 'khalifa-city', emirateId: abuDhabi.id },
    { name: 'Al Raha Beach', slug: 'al-raha-beach', emirateId: abuDhabi.id },
    { name: 'Al Majaz', slug: 'al-majaz', emirateId: sharjah.id },
    { name: 'Al Khan', slug: 'al-khan', emirateId: sharjah.id },
    { name: 'Al Nuaimiya', slug: 'al-nuaimiya', emirateId: ajman.id },
    { name: 'Al Hamra Village', slug: 'al-hamra-village', emirateId: rak.id },
  ]

  const communities = await Promise.all(
    communityDefs.map(def =>
      prisma.community.upsert({
        where: { emirateId_slug: { emirateId: def.emirateId, slug: def.slug } },
        update: { name: def.name },
        create: def,
      })
    )
  )

  const marinaGate = await prisma.subCommunity.upsert({
    where: { communityId_slug: { communityId: communities[0].id, slug: 'marina-gate' } },
    update: {},
    create: {
      name: 'Marina Gate',
      slug: 'marina-gate',
      communityId: communities[0].id,
    },
  })

  const amenities = await Promise.all([
    prisma.amenity.upsert({
      where: { name: 'Swimming Pool' },
      update: {},
      create: { name: 'Swimming Pool', icon: 'pool' },
    }),
    prisma.amenity.upsert({
      where: { name: 'Gym' },
      update: {},
      create: { name: 'Gym', icon: 'fitness' },
    }),
    prisma.amenity.upsert({
      where: { name: 'Parking' },
      update: {},
      create: { name: 'Parking', icon: 'parking' },
    }),
    prisma.amenity.upsert({
      where: { name: 'Balcony' },
      update: {},
      create: { name: 'Balcony', icon: 'balcony' },
    }),
    prisma.amenity.upsert({
      where: { name: 'Security' },
      update: {},
      create: { name: 'Security', icon: 'security' },
    }),
  ])

  const buyer = await upsertUser({
    email: 'buyer@test.com',
    firstName: 'Ahmed',
    lastName: 'Buyer',
    role: UserRole.BUYER,
    passwordHash,
  })

  const buyer2 = await upsertUser({
    email: 'buyer2@test.com',
    firstName: 'Sara',
    lastName: 'Al Mansoori',
    role: UserRole.BUYER,
    passwordHash,
  })

  const buyer3 = await upsertUser({
    email: 'buyer3@test.com',
    firstName: 'Omar',
    lastName: 'Khalid',
    role: UserRole.BUYER,
    passwordHash,
  })

  const buyer4 = await upsertUser({
    email: 'buyer4@test.com',
    firstName: 'Layla',
    lastName: 'Nasser',
    role: UserRole.BUYER,
    passwordHash,
  })

  const agentUser = await upsertUser({
    email: 'ahmed@ahmedamer.dev',
    firstName: 'Mohamed',
    lastName: 'Agent',
    role: UserRole.AGENT,
    passwordHash,
  })

  const agentUser2 = await upsertUser({
    email: 'agent2@test.com',
    firstName: 'Fatima',
    lastName: 'Hassan',
    role: UserRole.AGENT,
    passwordHash,
  })

  const agentUser3 = await upsertUser({
    email: 'agent3@test.com',
    firstName: 'Khalid',
    lastName: 'Al Rashid',
    role: UserRole.AGENT,
    passwordHash,
  })

  await upsertUser({
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    passwordHash,
  })

  const agency = await prisma.agency.upsert({
    where: { slug: 'bayara-real-estate' },
    update: { isVerified: true },
    create: {
      name: 'Bayara Real Estate',
      slug: 'bayara-real-estate',
      email: 'info@bayara.com',
      phone: '+971500000000',
      isVerified: true,
    },
  })

  const premiumAgency = await prisma.agency.upsert({
    where: { slug: 'premium-homes-uae' },
    update: { isVerified: true },
    create: {
      name: 'Premium Homes UAE',
      slug: 'premium-homes-uae',
      email: 'hello@premiumhomes.ae',
      phone: '+971500000001',
      isVerified: true,
    },
  })

  const agent = await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: { agencyId: agency.id, leadCredits: 25 },
    create: {
      userId: agentUser.id,
      agencyId: agency.id,
      bio: 'Professional Dubai property consultant with 8 years of experience.',
      languages: ['en', 'ar'],
      leadCredits: 25,
    },
  })

  const agent2 = await prisma.agent.upsert({
    where: { userId: agentUser2.id },
    update: { agencyId: premiumAgency.id },
    create: {
      userId: agentUser2.id,
      agencyId: premiumAgency.id,
      bio: 'Abu Dhabi and Sharjah specialist focusing on family homes.',
      languages: ['en', 'ar', 'ur'],
      leadCredits: 10,
    },
  })

  const agent3 = await prisma.agent.upsert({
    where: { userId: agentUser3.id },
    update: { agencyId: agency.id, leadCredits: 5 },
    create: {
      userId: agentUser3.id,
      agencyId: agency.id,
      bio: 'Northern emirates specialist for villas and land plots.',
      languages: ['en', 'ar'],
      leadCredits: 5,
    },
  })

  const agents = [agent, agent2, agent3]
  const agentUsers = [agentUser, agentUser2, agentUser3]
  const agencies = [agency, premiumAgency, agency]
  const buyers = [buyer, buyer2, buyer3, buyer4]

  const starterPlan = await upsertPlan({
    name: 'Starter',
    interval: PlanInterval.MONTHLY,
    priceAed: 299,
    maxListings: 10,
    maxFeatured: 1,
  })

  const professionalPlan = await upsertPlan({
    name: 'Professional',
    interval: PlanInterval.MONTHLY,
    priceAed: 599,
    maxListings: 30,
    maxFeatured: 5,
  })

  await upsertPlan({
    name: 'Enterprise',
    interval: PlanInterval.YEARLY,
    priceAed: 5999,
    maxListings: 100,
    maxFeatured: 20,
  })

  const createdProperties: Array<{ id: string; slug: string; title: string }> = []

  function resolveListingStatus(index: number): ListingStatus {
    if (index % 17 === 0) return ListingStatus.SOLD
    if (index % 19 === 0) return ListingStatus.RENTED
    if (index % 23 === 0) return ListingStatus.DRAFT
    if (index % 29 === 0) return ListingStatus.PENDING
    return ListingStatus.ACTIVE
  }

  for (let index = 0; index < PROPERTY_COUNT; index += 1) {
    const community = communities[index % communities.length]
    const propertyType = PROPERTY_TYPES[index % PROPERTY_TYPES.length]
    const listingType = index % 3 === 0 ? ListingType.RENT : ListingType.SALE
    const bedrooms =
      propertyType === PropertyType.STUDIO
        ? 0
        : propertyType === PropertyType.LAND
          ? null
          : (index % 5) + 1
    const bathrooms =
      propertyType === PropertyType.LAND ? null : Math.max(1, bedrooms ?? 1)
    const isFeatured = index < 15
    const agentIndex = index % agents.length
    const assignedAgent = agents[agentIndex]
    const assignedAgency = agencies[agentIndex]
    const owner = agentUsers[agentIndex]
    const status = resolveListingStatus(index)

    const titleBase =
      listingType === ListingType.SALE
        ? `${bedrooms || 'Studio'}BR ${propertyType.toLowerCase()} in ${community.name}`
        : `${bedrooms || 'Studio'}BR ${propertyType.toLowerCase()} for rent in ${community.name}`

    const slug = slugify(`${community.slug}-${propertyType.toLowerCase()}-${index + 1}`)
    const price =
      listingType === ListingType.SALE
        ? 650000 + index * 125000 + bedrooms * 50000
        : 35000 + index * 2500 + bedrooms * 3000

    const property = await prisma.property.upsert({
      where: { slug },
      update: {
        title: titleBase,
        status,
        price: new Prisma.Decimal(price),
        isFeatured: status === ListingStatus.ACTIVE && isFeatured,
        publishedAt: status === ListingStatus.DRAFT ? null : daysFromNow(-(index % 30)),
        viewsCount: 50 + index * 17,
      },
      create: {
        title: titleBase,
        slug,
        description: `Spacious ${propertyType.toLowerCase()} located in ${community.name}. Ideal for ${listingType === ListingType.SALE ? 'buyers' : 'tenants'} looking for quality living with modern amenities, excellent connectivity, and nearby schools and retail.`,
        propertyType,
        listingType,
        status,
        price: new Prisma.Decimal(price),
        rentFrequency: listingType === ListingType.RENT ? RentFrequency.YEARLY : null,
        bedrooms,
        bathrooms,
        areaSqft: new Prisma.Decimal(650 + bedrooms * 420 + (index % 7) * 90),
        floor: propertyType === PropertyType.VILLA ? null : (index % 25) + 1,
        parkingSpots: bedrooms >= 3 ? 2 : 1,
        furnished: index % 2 === 0,
        emirateId: community.emirateId,
        communityId: community.id,
        subCommunityId: community.slug === 'dubai-marina' && index % 4 === 0 ? marinaGate.id : null,
        addressLine: `${community.name}, UAE`,
        ownerId: owner.id,
        agentId: assignedAgent.id,
        agencyId: assignedAgency.id,
        isFeatured: status === ListingStatus.ACTIVE && isFeatured,
        featuredExpiry: status === ListingStatus.ACTIVE && isFeatured ? daysFromNow(14) : null,
        publishedAt: status === ListingStatus.DRAFT ? null : daysFromNow(-(index % 30)),
        viewsCount: 50 + index * 17,
      },
    })

    createdProperties.push({ id: property.id, slug: property.slug, title: property.title })

    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } })
    await prisma.propertyImage.createMany({
      data: [
        {
          propertyId: property.id,
          url: PROPERTY_IMAGES[index % PROPERTY_IMAGES.length],
          isCover: true,
          order: 0,
        },
        {
          propertyId: property.id,
          url: PROPERTY_IMAGES[(index + 3) % PROPERTY_IMAGES.length],
          isCover: false,
          order: 1,
        },
      ],
    })

    await prisma.propertyAmenity.deleteMany({ where: { propertyId: property.id } })
    await prisma.propertyAmenity.createMany({
      data: amenities.slice(0, 3 + (index % 3)).map(amenity => ({
        propertyId: property.id,
        amenityId: amenity.id,
      })),
    })
  }

  const apartment = createdProperties[0]
  const villa = createdProperties.find(p => p.slug.includes('villa')) ?? createdProperties[1]

  await prisma.favorite.upsert({
    where: { userId_propertyId: { userId: buyer.id, propertyId: apartment.id } },
    update: {},
    create: { userId: buyer.id, propertyId: apartment.id },
  })

  await prisma.favorite.upsert({
    where: { userId_propertyId: { userId: buyer.id, propertyId: villa.id } },
    update: {},
    create: { userId: buyer.id, propertyId: villa.id },
  })

  for (let index = 0; index < 12; index += 1) {
    const buyerUser = buyers[index % buyers.length]
    const property = createdProperties[(index * 7) % createdProperties.length]
    await prisma.favorite.upsert({
      where: { userId_propertyId: { userId: buyerUser.id, propertyId: property.id } },
      update: {},
      create: { userId: buyerUser.id, propertyId: property.id },
    })
  }

  for (const buyerUser of buyers) {
    const savedSearchCount = await prisma.savedSearch.count({ where: { userId: buyerUser.id } })
    if (savedSearchCount > 0) continue

    await prisma.savedSearch.createMany({
      data: [
        {
          userId: buyerUser.id,
          name: 'Dubai Apartments under 2M',
          filters: { propertyType: 'APARTMENT', listingType: 'SALE', maxPrice: 2000000 },
          alertsOn: true,
        },
        {
          userId: buyerUser.id,
          name: 'Marina rentals',
          filters: { community: 'dubai-marina', listingType: 'RENT' },
          alertsOn: false,
        },
      ],
    })
  }

  const leadCount = await prisma.lead.count()
  if (leadCount < LEAD_COUNT) {
    await prisma.lead.createMany({
      data: createdProperties.slice(0, LEAD_COUNT).map((property, index) => {
        const buyerUser = buyers[index % buyers.length]
        const leadStatuses = [
          LeadStatus.NEW,
          LeadStatus.CONTACTED,
          LeadStatus.QUALIFIED,
          LeadStatus.CLOSED,
        ] as const
        return {
          propertyId: property.id,
          senderId: buyerUser.id,
          name: `${buyerUser.firstName} ${buyerUser.lastName}`,
          email: buyerUser.email,
          phone: '+971500000' + String(index).padStart(2, '0'),
          message: `Interested in ${property.title}`,
          status: leadStatuses[index % leadStatuses.length],
        }
      }),
    })
  }

  // ======================================
  // Agent subscription + payments
  // ======================================

  let agentSubscription = await prisma.subscription.findFirst({
    where: { agentId: agent.id, status: SubscriptionStatus.ACTIVE },
  })

  if (!agentSubscription) {
    const subscriptionPayment = await createPayment({
      userId: agentUser.id,
      purpose: PaymentPurpose.SUBSCRIPTION,
      amountAed: Number(professionalPlan.priceAed),
      status: PaymentStatus.CAPTURED,
      metadata: { planId: professionalPlan.id },
      providerRef: 'seed-agent-subscription-payment',
    })

    agentSubscription = await prisma.subscription.create({
      data: {
        agentId: agent.id,
        planId: professionalPlan.id,
        status: SubscriptionStatus.ACTIVE,
        providerRef: 'seed-stripe-subscription-ref',
        currentPeriodStart: daysFromNow(-10),
        currentPeriodEnd: daysFromNow(20),
        payments: { connect: { id: subscriptionPayment.id } },
      },
    })
  }

  const existingBoostPayment = await prisma.payment.findFirst({
    where: { userId: agentUser.id, purpose: PaymentPurpose.LISTING_BOOST },
  })

  if (!existingBoostPayment) {
    await createPayment({
      userId: agentUser.id,
      purpose: PaymentPurpose.LISTING_BOOST,
      amountAed: 150,
      status: PaymentStatus.CAPTURED,
      metadata: { propertyId: apartment.id, boostDays: 3 },
      providerRef: 'seed-agent-boost-payment',
    })

    await prisma.property.update({
      where: { id: apartment.id },
      data: {
        isFeatured: true,
        featuredExpiry: daysFromNow(3),
      },
    })
  }

  const existingCreditsPayment = await prisma.payment.findFirst({
    where: { userId: agentUser.id, purpose: PaymentPurpose.LEAD_CREDITS },
  })

  if (!existingCreditsPayment) {
    await createPayment({
      userId: agentUser.id,
      purpose: PaymentPurpose.LEAD_CREDITS,
      amountAed: 50,
      status: PaymentStatus.CAPTURED,
      metadata: { creditCount: 10 },
      providerRef: 'seed-agent-lead-credits-payment',
    })
  }

  const existingAgent2SubPayment = await prisma.payment.findFirst({
    where: { userId: agentUser2.id, purpose: PaymentPurpose.SUBSCRIPTION },
  })

  if (!existingAgent2SubPayment) {
    await createPayment({
      userId: agentUser2.id,
      purpose: PaymentPurpose.SUBSCRIPTION,
      amountAed: Number(starterPlan.priceAed),
      status: PaymentStatus.PENDING,
      metadata: { planId: starterPlan.id },
      providerRef: 'seed-agent2-pending-subscription',
    })
  }

  // ======================================
  // Buyer viewings + deposit payments
  // ======================================

  async function seedViewingIfMissing(input: {
    slug: string
    propertyId: string
    buyerId: string
    agentId: string
    scheduledAt: Date
    status: ViewingStatus
    depositStatus: DepositStatus
    paymentStatus: PaymentStatus
    providerRef: string
  }) {
    const existing = await prisma.viewing.findFirst({
      where: {
        buyerId: input.buyerId,
        propertyId: input.propertyId,
        status: input.status,
      },
    })

    if (existing) return existing

    const payment = await createPayment({
      userId: input.buyerId,
      purpose: PaymentPurpose.VIEWING_DEPOSIT,
      amountAed: DEPOSIT_AMOUNT,
      status: input.paymentStatus,
      metadata: { seedSlug: input.slug },
      providerRef: input.providerRef,
    })

    return prisma.viewing.create({
      data: {
        propertyId: input.propertyId,
        buyerId: input.buyerId,
        agentId: input.agentId,
        scheduledAt: input.scheduledAt,
        status: input.status,
        depositStatus: input.depositStatus,
        depositAmount: new Prisma.Decimal(DEPOSIT_AMOUNT),
        depositPaymentId: payment.id,
        completedAt: input.status === ViewingStatus.COMPLETED ? daysFromNow(-1) : null,
        canceledAt:
          input.status === ViewingStatus.CANCELED_BY_BUYER ? daysFromNow(-2) : null,
        cancelReason:
          input.status === ViewingStatus.CANCELED_BY_BUYER
            ? 'Schedule conflict'
            : null,
      },
    })
  }

  await seedViewingIfMissing({
    slug: 'buyer-confirmed-viewing',
    propertyId: apartment.id,
    buyerId: buyer.id,
    agentId: agent.id,
    scheduledAt: daysFromNow(5, 11),
    status: ViewingStatus.CONFIRMED,
    depositStatus: DepositStatus.HELD,
    paymentStatus: PaymentStatus.CAPTURED,
    providerRef: 'seed-buyer-confirmed-deposit',
  })

  await seedViewingIfMissing({
    slug: 'buyer-completed-viewing',
    propertyId: villa.id,
    buyerId: buyer.id,
    agentId: agent.id,
    scheduledAt: daysFromNow(-3, 10),
    status: ViewingStatus.COMPLETED,
    depositStatus: DepositStatus.REFUNDED,
    paymentStatus: PaymentStatus.REFUNDED,
    providerRef: 'seed-buyer-refunded-deposit',
  })

  await seedViewingIfMissing({
    slug: 'buyer-pending-deposit',
    propertyId: createdProperties[3].id,
    buyerId: buyer.id,
    agentId: agent.id,
    scheduledAt: daysFromNow(7, 15),
    status: ViewingStatus.DEPOSIT_PENDING,
    depositStatus: DepositStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    providerRef: 'seed-buyer-pending-deposit',
  })

  await seedViewingIfMissing({
    slug: 'buyer-canceled-viewing',
    propertyId: createdProperties[4].id,
    buyerId: buyer2.id,
    agentId: agent2.id,
    scheduledAt: daysFromNow(10, 12),
    status: ViewingStatus.CANCELED_BY_BUYER,
    depositStatus: DepositStatus.REFUNDED,
    paymentStatus: PaymentStatus.REFUNDED,
    providerRef: 'seed-buyer2-canceled-deposit',
  })

  await seedViewingIfMissing({
    slug: 'buyer2-confirmed-viewing',
    propertyId: createdProperties[5].id,
    buyerId: buyer2.id,
    agentId: agent2.id,
    scheduledAt: daysFromNow(4, 16),
    status: ViewingStatus.CONFIRMED,
    depositStatus: DepositStatus.HELD,
    paymentStatus: PaymentStatus.CAPTURED,
    providerRef: 'seed-buyer2-confirmed-deposit',
  })

  await seedViewingIfMissing({
    slug: 'buyer3-confirmed-viewing',
    propertyId: createdProperties[8].id,
    buyerId: buyer3.id,
    agentId: agent3.id,
    scheduledAt: daysFromNow(6, 13),
    status: ViewingStatus.CONFIRMED,
    depositStatus: DepositStatus.HELD,
    paymentStatus: PaymentStatus.CAPTURED,
    providerRef: 'seed-buyer3-confirmed-deposit',
  })

  await seedViewingIfMissing({
    slug: 'buyer3-failed-deposit',
    propertyId: createdProperties[9].id,
    buyerId: buyer3.id,
    agentId: agent3.id,
    scheduledAt: daysFromNow(8, 10),
    status: ViewingStatus.DEPOSIT_PENDING,
    depositStatus: DepositStatus.FAILED,
    paymentStatus: PaymentStatus.FAILED,
    providerRef: 'seed-buyer3-failed-deposit',
  })

  await seedViewingIfMissing({
    slug: 'buyer4-completed-viewing',
    propertyId: createdProperties[10].id,
    buyerId: buyer4.id,
    agentId: agent.id,
    scheduledAt: daysFromNow(-5, 9),
    status: ViewingStatus.COMPLETED,
    depositStatus: DepositStatus.REFUNDED,
    paymentStatus: PaymentStatus.REFUNDED,
    providerRef: 'seed-buyer4-refunded-deposit',
  })

  const existingAgent3Boost = await prisma.payment.findFirst({
    where: { userId: agentUser3.id, purpose: PaymentPurpose.LISTING_BOOST },
  })

  if (!existingAgent3Boost) {
    await createPayment({
      userId: agentUser3.id,
      purpose: PaymentPurpose.LISTING_BOOST,
      amountAed: 200,
      status: PaymentStatus.CAPTURED,
      metadata: { propertyId: createdProperties[11].id, boostDays: 4 },
      providerRef: 'seed-agent3-boost-payment',
    })
  }

  const existingAgent3Credits = await prisma.payment.findFirst({
    where: { userId: agentUser3.id, purpose: PaymentPurpose.LEAD_CREDITS },
  })

  if (!existingAgent3Credits) {
    await createPayment({
      userId: agentUser3.id,
      purpose: PaymentPurpose.LEAD_CREDITS,
      amountAed: 25,
      status: PaymentStatus.CAPTURED,
      metadata: { creditCount: 5 },
      providerRef: 'seed-agent3-lead-credits-payment',
    })
  }

  const existingAgent3FailedSub = await prisma.payment.findFirst({
    where: { userId: agentUser3.id, purpose: PaymentPurpose.SUBSCRIPTION, status: PaymentStatus.FAILED },
  })

  if (!existingAgent3FailedSub) {
    await createPayment({
      userId: agentUser3.id,
      purpose: PaymentPurpose.SUBSCRIPTION,
      amountAed: Number(starterPlan.priceAed),
      status: PaymentStatus.FAILED,
      metadata: { planId: starterPlan.id },
      providerRef: 'seed-agent3-failed-subscription',
    })
  }

  const [propertyTotal, leadTotal, viewingTotal, favoriteTotal] = await Promise.all([
    prisma.property.count(),
    prisma.lead.count(),
    prisma.viewing.count(),
    prisma.favorite.count(),
  ])

  const paymentSummary = await prisma.payment.groupBy({
    by: ['purpose', 'status'],
    _count: { _all: true },
  })

  console.log('✅ Seed completed')
  console.log(`   Password for all test users: ${PASSWORD}`)
  console.log('   Buyers: buyer@test.com, buyer2@test.com, buyer3@test.com, buyer4@test.com')
  console.log('   Agents: ahmed@ahmedamer.dev, agent2@test.com, agent3@test.com')
  console.log('   Admin: admin@test.com')
  console.log(`   Properties: ${propertyTotal} (${createdProperties.length} upserted this run)`)
  console.log(`   Leads: ${leadTotal} | Viewings: ${viewingTotal} | Favorites: ${favoriteTotal}`)
  console.log(`   Communities: ${communities.length} | Emirates: ${emirates.length}`)
  console.log(`   Agent subscription (ahmed@ahmedamer.dev): ${agentSubscription.id}`)
  console.log('   Payment records:')
  for (const row of paymentSummary) {
    console.log(`     - ${row.purpose} / ${row.status}: ${row._count._all}`)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
