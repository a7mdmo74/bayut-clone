import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10)
  }

  // Create emirates
  const dubai = await prisma.emirate.upsert({
    where: { name: 'Dubai' },
    update: {},
    create: { name: 'Dubai', slug: 'dubai' },
  })

  const abuDhabi = await prisma.emirate.upsert({
    where: { name: 'Abu Dhabi' },
    update: {},
    create: { name: 'Abu Dhabi', slug: 'abu-dhabi' },
  })

  console.log('✅ Emirates created')

  // Create communities
  const marina = await prisma.community.upsert({
    where: { id: 'test-marina-id' },
    update: {},
    create: {
      id: 'test-marina-id',
      name: 'Dubai Marina',
      slug: 'dubai-marina',
      emirateId: dubai.id,
    },
  })

  const downtown = await prisma.community.upsert({
    where: { id: 'test-downtown-id' },
    update: {},
    create: {
      id: 'test-downtown-id',
      name: 'Downtown Dubai',
      slug: 'downtown-dubai',
      emirateId: dubai.id,
    },
  })

  console.log('✅ Communities created')

  // Create amenities
  const pool = await prisma.amenity.upsert({
    where: { name: 'Swimming Pool' },
    update: {},
    create: { name: 'Swimming Pool', icon: 'pool' },
  })

  const gym = await prisma.amenity.upsert({
    where: { name: 'Gym' },
    update: {},
    create: { name: 'Gym', icon: 'fitness_center' },
  })

  const parking = await prisma.amenity.upsert({
    where: { name: 'Parking' },
    update: {},
    create: { name: 'Parking', icon: 'local_parking' },
  })

  console.log('✅ Amenities created')

  // Create users
  const hashedPassword = await hashPassword('password123')

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      password: hashedPassword,
      firstName: 'Buyer',
      lastName: 'User',
      role: 'BUYER',
    },
  })

  const agent = await prisma.user.upsert({
    where: { email: 'agent@example.com' },
    update: { role: 'AGENT' },
    create: {
      email: 'agent@example.com',
      password: hashedPassword,
      firstName: 'Agent',
      lastName: 'User',
      role: 'AGENT',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  })

  console.log('✅ Users created')

  // Create agent profile
  const agentProfile = await prisma.agent.upsert({
    where: { userId: agent.id },
    update: {},
    create: {
      userId: agent.id,
      bio: 'Experienced real estate agent',
      languages: ['en', 'ar'],
    },
  })

  console.log('✅ Agent profile created')

  // Create properties
  const property1 = await prisma.property.upsert({
    where: { slug: 'luxury-apartment-marina' },
    update: {},
    create: {
      id: 'test-property-1',
      title: 'Luxury Apartment in Dubai Marina',
      slug: 'luxury-apartment-marina',
      description: 'Beautiful 2-bedroom apartment with stunning marina views',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      status: 'ACTIVE',
      price: 1500000,
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 1200,
      furnished: true,
      communityId: marina.id,
      ownerId: agent.id,
      agentId: agentProfile.id,
    },
  })

  const property2 = await prisma.property.upsert({
    where: { slug: 'modern-villa-downtown' },
    update: {},
    create: {
      id: 'test-property-2',
      title: 'Modern Villa in Downtown Dubai',
      slug: 'modern-villa-downtown',
      description: 'Spacious 4-bedroom villa with private pool',
      propertyType: 'VILLA',
      listingType: 'RENT',
      status: 'ACTIVE',
      price: 15000,
      rentFrequency: 'MONTHLY',
      bedrooms: 4,
      bathrooms: 5,
      areaSqft: 3500,
      furnished: false,
      communityId: downtown.id,
      ownerId: agent.id,
      agentId: agentProfile.id,
    },
  })

  console.log('✅ Properties created')

  // Add amenities to properties
  await prisma.propertyAmenity.upsert({
    where: {
      propertyId_amenityId: {
        propertyId: property1.id,
        amenityId: pool.id,
      },
    },
    update: {},
    create: {
      propertyId: property1.id,
      amenityId: pool.id,
    },
  })

  await prisma.propertyAmenity.upsert({
    where: {
      propertyId_amenityId: {
        propertyId: property1.id,
        amenityId: gym.id,
      },
    },
    update: {},
    create: {
      propertyId: property1.id,
      amenityId: gym.id,
    },
  })

  console.log('✅ Property amenities added')

  // Create property images
  await prisma.propertyImage.upsert({
    where: { id: 'test-image-1' },
    update: {},
    create: {
      id: 'test-image-1',
      propertyId: property1.id,
      url: 'https://example.com/image1.jpg',
      isCover: true,
    },
  })

  await prisma.propertyImage.upsert({
    where: { id: 'test-image-2' },
    update: {},
    create: {
      id: 'test-image-2',
      propertyId: property2.id,
      url: 'https://example.com/image2.jpg',
      isCover: true,
    },
  })

  console.log('✅ Property images created')

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
