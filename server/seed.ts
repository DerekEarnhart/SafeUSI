import { db } from './db';
import { users } from '@shared/schema';
import crypto from 'crypto';

async function seed() {
  console.log('Starting database seed...');
  
  try {
    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'owner_admin')
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      return;
    }
    
    // Hash password using the same method as signup
    const password = 'WSM2025!Secure';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;
    
    // Create admin user
    const [adminUser] = await db.insert(users).values({
      username: 'owner_admin',
      password: hashedPassword,
      email: 'derekearnhart@safeusi.com',
      accessLevel: 'admin',
      waitingListStatus: 'approved',
      settings: {
        fullName: 'System Administrator',
        company: 'WSM AI',
        role: 'Owner'
      }
    }).returning();
    
    console.log('✅ Admin user created successfully:');
    console.log('   Username:', adminUser.username);
    console.log('   Email:', adminUser.email);
    console.log('   Access Level:', adminUser.accessLevel);
    console.log('   Password: WSM2025!Secure');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('✅ Database seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database seed failed:', error);
    process.exit(1);
  });
