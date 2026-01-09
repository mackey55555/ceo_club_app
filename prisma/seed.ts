import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

// Prisma 7では、prisma.config.tsから接続情報が自動的に読み込まれます
// 環境変数DATABASE_URLが設定されていることを確認
const prisma = new PrismaClient();

async function main() {
  // 会員ステータスの初期データ
  await prisma.memberStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'pending',
      description: '承認待ち',
    },
  });

  await prisma.memberStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'active',
      description: '有効',
    },
  });

  await prisma.memberStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'suspended',
      description: '停止中',
    },
  });

  await prisma.memberStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'rejected',
      description: '却下',
    },
  });

  // お知らせステータスの初期データ
  await prisma.newsStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      name: 'draft',
    },
  });

  await prisma.newsStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      name: 'published',
    },
  });

  await prisma.newsStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000103' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000103',
      name: 'archived',
    },
  });

  // イベントステータスの初期データ
  await prisma.eventStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      name: 'draft',
    },
  });

  await prisma.eventStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000202' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000202',
      name: 'published',
    },
  });

  await prisma.eventStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000203' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000203',
      name: 'closed',
    },
  });

  await prisma.eventStatus.upsert({
    where: { id: '00000000-0000-0000-0000-000000000204' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000204',
      name: 'cancelled',
    },
  });

  // 管理者のテストデータ
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.administrator.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: '管理者',
      isActive: true,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: '管理者',
      isActive: true,
    },
  });

  console.log('✅ シードデータの投入が完了しました');
  console.log('📧 管理者ログイン情報:');
  console.log('   メールアドレス: admin@example.com');
  console.log('   パスワード: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

