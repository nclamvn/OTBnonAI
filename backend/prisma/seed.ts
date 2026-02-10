// ============================================================================
// Database Seed — 3-Year Mock Data (2023-2025)
// DAFC OTB Luxury Fashion Buying Platform
// Run: npx prisma db seed   or   npm run prisma:seed
// ============================================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 DAFC OTB — Seeding 3-Year Mock Data (2023-2025)');
  console.log('═'.repeat(60));

  // ─── CLEANUP (delete in reverse-dependency order) ─────────────────────
  console.log('  🧹 Cleaning existing data...');
  await prisma.productAllocation.deleteMany();
  await prisma.proposalProduct.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.approvalWorkflowStep.deleteMany();
  await prisma.planningDetail.deleteMany();
  await prisma.planningVersion.deleteMany();
  await prisma.budgetDetail.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.skuCatalog.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.gender.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.groupBrand.deleteMany();
  await prisma.store.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  console.log('  ✅ Database cleaned');

  // ─── ROLES ──────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'System Administrator — Full system access',
        permissions: ['*'],
      },
    }),
    prisma.role.upsert({
      where: { name: 'buyer' },
      update: {},
      create: {
        name: 'buyer',
        description: 'Buyer — creates proposals, manages SKU selection',
        permissions: [
          'budget:read',
          'planning:read',
          'proposal:read', 'proposal:write', 'proposal:submit',
          'master:read',
        ],
      },
    }),
    prisma.role.upsert({
      where: { name: 'merchandiser' },
      update: {},
      create: {
        name: 'merchandiser',
        description: 'Merchandiser — creates budgets and planning',
        permissions: [
          'budget:read', 'budget:write', 'budget:submit',
          'planning:read', 'planning:write', 'planning:submit',
          'proposal:read',
          'master:read',
        ],
      },
    }),
    prisma.role.upsert({
      where: { name: 'merch_manager' },
      update: {},
      create: {
        name: 'merch_manager',
        description: 'Merchandising Manager — Level 1 Approver',
        permissions: [
          'budget:read', 'budget:write', 'budget:submit', 'budget:approve_l1',
          'planning:read', 'planning:write', 'planning:approve_l1',
          'proposal:read', 'proposal:approve_l1',
          'master:read',
        ],
      },
    }),
    prisma.role.upsert({
      where: { name: 'finance_director' },
      update: {},
      create: {
        name: 'finance_director',
        description: 'Finance Director — Level 2 Approver',
        permissions: [
          'budget:read', 'budget:approve_l2',
          'planning:read', 'planning:approve_l2',
          'proposal:read', 'proposal:approve_l2',
          'master:read',
        ],
      },
    }),
  ]);

  const [adminRole, buyerRole, merchRole, merchMgrRole, finDirRole] = roles;
  console.log(`  ✅ ${roles.length} roles`);

  // ─── STORES ─────────────────────────────────────────────────────────────
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { code: 'REX' },
      update: { name: 'REX Saigon', region: 'HCMC' },
      create: { code: 'REX', name: 'REX Saigon', region: 'HCMC' },
    }),
    prisma.store.upsert({
      where: { code: 'TTP' },
      update: { name: 'TTP Hanoi', region: 'Hanoi' },
      create: { code: 'TTP', name: 'TTP Hanoi', region: 'Hanoi' },
    }),
    prisma.store.upsert({
      where: { code: 'REX-DN' },
      update: {},
      create: { code: 'REX-DN', name: 'REX Da Nang', region: 'Da Nang' },
    }),
    prisma.store.upsert({
      where: { code: 'TTP-HP' },
      update: {},
      create: { code: 'TTP-HP', name: 'TTP Hai Phong', region: 'Hai Phong' },
    }),
    prisma.store.upsert({
      where: { code: 'ONLINE-VN' },
      update: {},
      create: { code: 'ONLINE-VN', name: 'DAFC Online Vietnam', region: 'Vietnam' },
    }),
  ]);
  const [storeREX, storeTTP, storeDN, storeHP, storeOnline] = stores;
  console.log(`  ✅ ${stores.length} stores`);

  // ─── GROUP BRANDS ───────────────────────────────────────────────────────
  const brands = await Promise.all([
    prisma.groupBrand.upsert({
      where: { code: 'FER' },
      update: {},
      create: {
        code: 'FER', name: 'Ferragamo', groupId: 'A',
        colorConfig: { gradient: 'from-rose-400 to-rose-600', primary: '#8B4513' },
        sortOrder: 1,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'BUR' },
      update: {},
      create: {
        code: 'BUR', name: 'Burberry', groupId: 'A',
        colorConfig: { gradient: 'from-amber-400 to-amber-600', primary: '#D4A574' },
        sortOrder: 2,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'GUC' },
      update: {},
      create: {
        code: 'GUC', name: 'Gucci', groupId: 'A',
        colorConfig: { gradient: 'from-emerald-400 to-emerald-600', primary: '#006400' },
        sortOrder: 3,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'PRA' },
      update: {},
      create: {
        code: 'PRA', name: 'Prada', groupId: 'B',
        colorConfig: { gradient: 'from-purple-400 to-purple-600', primary: '#000000' },
        sortOrder: 4,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'LV' },
      update: {},
      create: {
        code: 'LV', name: 'Louis Vuitton', groupId: 'A',
        colorConfig: { gradient: 'from-yellow-700 to-amber-900', primary: '#8B4513' },
        sortOrder: 5,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'DG' },
      update: {},
      create: {
        code: 'DG', name: 'Dolce & Gabbana', groupId: 'B',
        colorConfig: { gradient: 'from-red-500 to-red-700', primary: '#C41E3A' },
        sortOrder: 6,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'VER' },
      update: {},
      create: {
        code: 'VER', name: 'Versace', groupId: 'B',
        colorConfig: { gradient: 'from-yellow-400 to-yellow-600', primary: '#FFD700' },
        sortOrder: 7,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'BAL' },
      update: {},
      create: {
        code: 'BAL', name: 'Balenciaga', groupId: 'C',
        colorConfig: { gradient: 'from-gray-600 to-gray-800', primary: '#000000' },
        sortOrder: 8,
      },
    }),
  ]);
  const [brandFER, brandBUR, brandGUC, brandPRA, brandLV, brandDG, brandVER, brandBAL] = brands;
  console.log(`  ✅ ${brands.length} brands`);

  // ─── COLLECTIONS ────────────────────────────────────────────────────────
  const collections = await Promise.all([
    prisma.collection.upsert({ where: { name: 'Carry Over' }, update: {}, create: { name: 'Carry Over' } }),
    prisma.collection.upsert({ where: { name: 'Seasonal' }, update: {}, create: { name: 'Seasonal' } }),
  ]);
  console.log(`  ✅ ${collections.length} collections`);

  // ─── GENDERS ────────────────────────────────────────────────────────────
  const genders = await Promise.all([
    prisma.gender.upsert({ where: { name: 'Female' }, update: {}, create: { name: 'Female' } }),
    prisma.gender.upsert({ where: { name: 'Male' }, update: {}, create: { name: 'Male' } }),
  ]);
  const [female, male] = genders;
  console.log(`  ✅ ${genders.length} genders`);

  // ─── CATEGORIES + SUB-CATEGORIES ───────────────────────────────────────
  // Women categories
  const womenRtw = await prisma.category.upsert({
    where: { id: 'women_rtw' },
    update: {},
    create: { id: 'women_rtw', name: "WOMEN'S RTW", genderId: female.id },
  });
  const womenHardAcc = await prisma.category.upsert({
    where: { id: 'women_hard_acc' },
    update: {},
    create: { id: 'women_hard_acc', name: 'WOMEN HARD ACCESSORIES', genderId: female.id },
  });
  const womenOthers = await prisma.category.upsert({
    where: { id: 'women_others' },
    update: {},
    create: { id: 'women_others', name: 'OTHERS', genderId: female.id },
  });
  const womenBags = await prisma.category.upsert({
    where: { id: 'women_bags' },
    update: {},
    create: { id: 'women_bags', name: 'WOMEN BAGS', genderId: female.id },
  });
  const womenSlg = await prisma.category.upsert({
    where: { id: 'women_slg' },
    update: {},
    create: { id: 'women_slg', name: 'WOMEN SLG', genderId: female.id },
  });

  // Men categories
  const menRtw = await prisma.category.upsert({
    where: { id: 'men_rtw' },
    update: {},
    create: { id: 'men_rtw', name: "MEN'S RTW", genderId: male.id },
  });
  const menAcc = await prisma.category.upsert({
    where: { id: 'men_acc' },
    update: {},
    create: { id: 'men_acc', name: 'MEN ACCESSORIES', genderId: male.id },
  });
  const menBags = await prisma.category.upsert({
    where: { id: 'men_bags' },
    update: {},
    create: { id: 'men_bags', name: 'MEN BAGS', genderId: male.id },
  });

  // Sub-categories
  const subCategories = await Promise.all([
    // Women RTW
    prisma.subCategory.upsert({ where: { id: 'w_outerwear' }, update: {}, create: { id: 'w_outerwear', name: 'W Outerwear', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_tailoring' }, update: {}, create: { id: 'w_tailoring', name: 'W Tailoring', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_dresses' }, update: {}, create: { id: 'w_dresses', name: 'W Dresses', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_tops' }, update: {}, create: { id: 'w_tops', name: 'W Tops', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_body' }, update: {}, create: { id: 'w_body', name: 'W Body', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_bottoms' }, update: {}, create: { id: 'w_bottoms', name: 'W Bottoms', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_knitwear' }, update: {}, create: { id: 'w_knitwear', name: 'W Knitwear', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_jackets' }, update: {}, create: { id: 'w_jackets', name: 'W Jackets & Coats', categoryId: womenRtw.id } }),
    // Women Hard Accessories
    prisma.subCategory.upsert({ where: { id: 'w_bags' }, update: {}, create: { id: 'w_bags', name: 'W Bags', categoryId: womenHardAcc.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_slg' }, update: {}, create: { id: 'w_slg', name: 'W SLG', categoryId: womenHardAcc.id } }),
    // Women Bags
    prisma.subCategory.upsert({ where: { id: 'w_handbags' }, update: {}, create: { id: 'w_handbags', name: 'W Handbags', categoryId: womenBags.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_shoulder' }, update: {}, create: { id: 'w_shoulder', name: 'W Shoulder Bags', categoryId: womenBags.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_totes' }, update: {}, create: { id: 'w_totes', name: 'W Totes', categoryId: womenBags.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_crossbody' }, update: {}, create: { id: 'w_crossbody', name: 'W Crossbody', categoryId: womenBags.id } }),
    // Women Others (Shoes)
    prisma.subCategory.upsert({ where: { id: 'w_shoes' }, update: {}, create: { id: 'w_shoes', name: "Women's Shoes", categoryId: womenOthers.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_heels' }, update: {}, create: { id: 'w_heels', name: 'W Heels', categoryId: womenOthers.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_flats' }, update: {}, create: { id: 'w_flats', name: 'W Flats', categoryId: womenOthers.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_boots' }, update: {}, create: { id: 'w_boots', name: 'W Boots', categoryId: womenOthers.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_sandals' }, update: {}, create: { id: 'w_sandals', name: 'W Sandals', categoryId: womenOthers.id } }),
    // Women SLG
    prisma.subCategory.upsert({ where: { id: 'w_wallets' }, update: {}, create: { id: 'w_wallets', name: 'W Wallets', categoryId: womenSlg.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_cardholders' }, update: {}, create: { id: 'w_cardholders', name: 'W Card Holders', categoryId: womenSlg.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_keychains' }, update: {}, create: { id: 'w_keychains', name: 'W Key Chains', categoryId: womenSlg.id } }),
    // Men RTW
    prisma.subCategory.upsert({ where: { id: 'm_outerwear' }, update: {}, create: { id: 'm_outerwear', name: 'M Outerwear', categoryId: menRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_tops' }, update: {}, create: { id: 'm_tops', name: 'M Tops', categoryId: menRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_bottoms' }, update: {}, create: { id: 'm_bottoms', name: 'M Bottoms', categoryId: menRtw.id } }),
    // Men Accessories
    prisma.subCategory.upsert({ where: { id: 'm_bags' }, update: {}, create: { id: 'm_bags', name: 'M Bags', categoryId: menAcc.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_slg' }, update: {}, create: { id: 'm_slg', name: 'M SLG', categoryId: menAcc.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_belts' }, update: {}, create: { id: 'm_belts', name: 'M Belts', categoryId: menAcc.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_scarves' }, update: {}, create: { id: 'm_scarves', name: 'M Scarves', categoryId: menAcc.id } }),
    // Men Bags
    prisma.subCategory.upsert({ where: { id: 'm_totes' }, update: {}, create: { id: 'm_totes', name: 'M Totes', categoryId: menBags.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_messenger' }, update: {}, create: { id: 'm_messenger', name: 'M Messenger', categoryId: menBags.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_backpacks' }, update: {}, create: { id: 'm_backpacks', name: 'M Backpacks', categoryId: menBags.id } }),
  ]);
  console.log(`  ✅ 8 categories + ${subCategories.length} sub-categories`);

  // ─── SKU CATALOG ────────────────────────────────────────────────────────
  // 30 luxury fashion SKUs across all brands (2023-2025)
  const skuData = [
    // === FERRAGAMO (20 SKUs) ===
    // Bags
    { skuCode: 'FER-BAG-001', productName: 'Gancini Mini Bag', productType: 'W BAGS', theme: 'SS23 Main', color: 'Nero', composition: 'Calfskin Leather', srp: 32000000, brandId: brandFER.id, seasonGroupId: 'SS', imageUrl: '/products/fer-bag-001.jpg' },
    { skuCode: 'FER-BAG-002', productName: 'Studio Bag Medium', productType: 'W BAGS', theme: 'SS23 Main', color: 'Bone', composition: 'Calfskin Leather', srp: 58000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-BAG-003', productName: 'Vara Bow Shoulder Bag', productType: 'W BAGS', theme: 'SS23 Pre', color: 'Lipstick', composition: 'Patent Leather', srp: 45000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-BAG-004', productName: 'Trifolio Crossbody', productType: 'W BAGS', theme: 'SS24 Main', color: 'Dawn Pink', composition: 'Calfskin Leather', srp: 38000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-BAG-005', productName: 'Wanda Tote Large', productType: 'W BAGS', theme: 'FW24 Main', color: 'Cocoa', composition: 'Grainy Leather', srp: 62000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // Shoes
    { skuCode: 'FER-SHO-001', productName: 'Gancini Pump 70', productType: 'W SHOES', theme: 'SS23 Main', color: 'Nero', composition: 'Calfskin Leather', srp: 22000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-SHO-002', productName: 'Vara Bow Ballet Flat', productType: 'W SHOES', theme: 'SS23 Pre', color: 'Caraway', composition: 'Patent Leather', srp: 18500000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-SHO-003', productName: 'Driver Moccasin', productType: 'M SHOES', theme: 'SS23 Main', color: 'Hickory', composition: 'Suede', srp: 16000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-SHO-004', productName: 'Glam Sandal 85', productType: 'W SHOES', theme: 'SS24 Main', color: 'Gold', composition: 'Metallic Leather', srp: 24000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-SHO-005', productName: 'Combat Boot', productType: 'W SHOES', theme: 'FW24 Main', color: 'Nero', composition: 'Calfskin Leather', srp: 32000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // RTW
    { skuCode: 'FER-RTW-001', productName: 'Silk Midi Dress', productType: 'W DRESSES', theme: 'SS23 Main', color: 'Poppy', composition: '100% Silk', srp: 52000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-RTW-002', productName: 'Cashmere Cardigan', productType: 'W KNITWEAR', theme: 'FW23 Main', color: 'Oatmeal', composition: '100% Cashmere', srp: 38000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-RTW-003', productName: 'Tailored Blazer', productType: 'W OUTERWEAR', theme: 'FW24 Main', color: 'Nero', composition: 'Virgin Wool', srp: 58000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-RTW-004', productName: 'Wide Leg Trouser', productType: 'W BOTTOMS', theme: 'FW24 Main', color: 'Nero', composition: 'Virgin Wool', srp: 32000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // Accessories & SLG
    { skuCode: 'FER-ACC-001', productName: 'Gancini Reversible Belt', productType: 'M ACCESSORIES', theme: 'Carryover', color: 'Black/Brown', composition: 'Calfskin Leather', srp: 12500000, brandId: brandFER.id },
    { skuCode: 'FER-ACC-002', productName: 'Silk Scarf', productType: 'W ACCESSORIES', theme: 'SS25 Main', color: 'Multicolor Print', composition: '100% Silk Twill', srp: 8500000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-ACC-003', productName: 'Aviator Sunglasses', productType: 'ACCESSORIES', theme: 'SS25 Main', color: 'Gold/Brown', composition: 'Metal Frame', srp: 9800000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-SLG-001', productName: 'Gancini Compact Wallet', productType: 'SLG', theme: 'Carryover', color: 'Nero', composition: 'Calfskin Leather', srp: 9500000, brandId: brandFER.id },
    { skuCode: 'FER-SLG-002', productName: 'Card Case', productType: 'SLG', theme: 'Carryover', color: 'Nero', composition: 'Calfskin Leather', srp: 6500000, brandId: brandFER.id },
    { skuCode: 'FER-SLG-003', productName: 'Gancini Key Ring', productType: 'SLG', theme: 'Carryover', color: 'Palladium', composition: 'Metal', srp: 4200000, brandId: brandFER.id },

    // === BURBERRY (5 SKUs) ===
    { skuCode: 'BUR-BAG-001', productName: 'TB Shoulder Bag', productType: 'W BAGS', theme: 'SS23 Main', color: 'Black', composition: 'Grainy Leather', srp: 48000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    { skuCode: 'BUR-BAG-002', productName: 'Lola Bag Medium', productType: 'W BAGS', theme: 'SS23 Main', color: 'Vintage Check', composition: 'Cotton Canvas', srp: 55000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    { skuCode: 'BUR-SHO-001', productName: 'Vintage Check Sneaker', productType: 'SHOES', theme: 'SS23 Main', color: 'Archive Beige', composition: 'Cotton Canvas & Leather', srp: 22000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    { skuCode: 'BUR-RTW-001', productName: 'Heritage Trench Coat', productType: 'W OUTERWEAR', theme: 'FW23 Main', color: 'Honey', composition: 'Cotton Gabardine', srp: 78000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
    { skuCode: 'BUR-ACC-001', productName: 'Giant Check Cashmere Scarf', productType: 'ACCESSORIES', theme: 'FW23 Main', color: 'Classic Check', composition: '100% Cashmere', srp: 15000000, brandId: brandBUR.id, seasonGroupId: 'FW' },

    // === GUCCI (4 SKUs) ===
    { skuCode: 'GUC-BAG-001', productName: 'GG Marmont Mini Bag', productType: 'W BAGS', theme: 'SS24 Main', color: 'Nero', composition: 'Matelassé Leather', srp: 42000000, brandId: brandGUC.id, seasonGroupId: 'SS' },
    { skuCode: 'GUC-BAG-002', productName: 'Dionysus GG Supreme', productType: 'W BAGS', theme: 'SS24 Main', color: 'Beige/Ebony', composition: 'GG Supreme Canvas', srp: 65000000, brandId: brandGUC.id, seasonGroupId: 'SS' },
    { skuCode: 'GUC-SHO-001', productName: 'Horsebit Loafer', productType: 'W SHOES', theme: 'SS24 Carryover', color: 'Nero', composition: 'Calfskin Leather', srp: 28000000, brandId: brandGUC.id, seasonGroupId: 'SS' },
    { skuCode: 'GUC-ACC-001', productName: 'GG Supreme Belt', productType: 'ACCESSORIES', theme: 'SS24 Carryover', color: 'Beige/Ebony', composition: 'GG Supreme Canvas', srp: 14000000, brandId: brandGUC.id, seasonGroupId: 'SS' },

    // === PRADA (10 SKUs) ===
    { skuCode: 'PRA-BAG-001', productName: 'Re-Edition 2005 Nylon Bag', productType: 'W BAGS', theme: 'SS24 Main', color: 'Nero', composition: 'Recycled Nylon', srp: 35000000, brandId: brandPRA.id, seasonGroupId: 'SS' },
    { skuCode: 'PRA-BAG-002', productName: 'Galleria Saffiano Tote', productType: 'W BAGS', theme: 'SS25 Main', color: 'Cipria', composition: 'Saffiano Leather', srp: 72000000, brandId: brandPRA.id, seasonGroupId: 'SS' },
    { skuCode: 'PRA-BAG-003', productName: 'Cleo Brushed Leather Bag', productType: 'W BAGS', theme: 'FW24 Main', color: 'Nero', composition: 'Brushed Leather', srp: 55000000, brandId: brandPRA.id, seasonGroupId: 'FW' },
    { skuCode: 'PRA-RTW-001', productName: 'Re-Nylon Puffer Jacket', productType: 'W OUTERWEAR', theme: 'FW25 Main', color: 'Nero', composition: 'Re-Nylon', srp: 89000000, brandId: brandPRA.id, seasonGroupId: 'FW' },
    { skuCode: 'PRA-RTW-002', productName: 'Silk Crepe Blouse', productType: 'W TOPS', theme: 'SS25 Main', color: 'Bianco', composition: '100% Silk', srp: 42000000, brandId: brandPRA.id, seasonGroupId: 'SS' },
    { skuCode: 'PRA-RTW-003', productName: 'Wool Tailored Trouser', productType: 'M OUTERWEAR', theme: 'FW25 Main', color: 'Nero', composition: 'Virgin Wool', srp: 38000000, brandId: brandPRA.id, seasonGroupId: 'FW' },
    { skuCode: 'PRA-RTW-004', productName: 'Cashmere Crew Neck', productType: 'M TOPS', theme: 'FW24 Main', color: 'Camel', composition: '100% Cashmere', srp: 45000000, brandId: brandPRA.id, seasonGroupId: 'FW' },
    { skuCode: 'PRA-SHO-001', productName: 'Monolith Chelsea Boot', productType: 'W SHOES', theme: 'FW25 Main', color: 'Nero', composition: 'Brushed Leather', srp: 38000000, brandId: brandPRA.id, seasonGroupId: 'FW' },
    { skuCode: 'PRA-ACC-001', productName: 'Saffiano Triangle Logo Belt', productType: 'M ACCESSORIES', theme: 'Carryover', color: 'Nero', composition: 'Saffiano Leather', srp: 14000000, brandId: brandPRA.id },
    { skuCode: 'PRA-SLG-001', productName: 'Small Saffiano Wallet', productType: 'SLG', theme: 'Carryover', color: 'Nero', composition: 'Saffiano Leather', srp: 12000000, brandId: brandPRA.id },

    // === LOUIS VUITTON (10 SKUs) ===
    { skuCode: 'LV-BAG-001', productName: 'Neverfull MM Monogram', productType: 'W BAGS', theme: 'Carryover', color: 'Monogram', composition: 'Monogram Canvas', srp: 48000000, brandId: brandLV.id },
    { skuCode: 'LV-BAG-002', productName: 'Speedy 25 Bandoulière', productType: 'W BAGS', theme: 'SS25 Main', color: 'Monogram', composition: 'Monogram Canvas', srp: 42000000, brandId: brandLV.id, seasonGroupId: 'SS' },
    { skuCode: 'LV-BAG-003', productName: 'Alma BB Epi', productType: 'W BAGS', theme: 'FW24 Main', color: 'Noir', composition: 'Epi Leather', srp: 52000000, brandId: brandLV.id, seasonGroupId: 'FW' },
    { skuCode: 'LV-BAG-004', productName: 'Keepall 45 Monogram', productType: 'M BAGS', theme: 'Carryover', color: 'Monogram', composition: 'Monogram Canvas', srp: 58000000, brandId: brandLV.id },
    { skuCode: 'LV-RTW-001', productName: 'Monogram Denim Jacket', productType: 'W OUTERWEAR', theme: 'SS25 Main', color: 'Blue', composition: 'Monogram Denim', srp: 72000000, brandId: brandLV.id, seasonGroupId: 'SS' },
    { skuCode: 'LV-RTW-002', productName: 'Silk Monogram Scarf Top', productType: 'W TOPS', theme: 'SS25 Main', color: 'Multicolor', composition: '100% Silk', srp: 38000000, brandId: brandLV.id, seasonGroupId: 'SS' },
    { skuCode: 'LV-SHO-001', productName: 'Archlight Sneaker', productType: 'W SHOES', theme: 'SS24 Main', color: 'White', composition: 'Technical Fabric', srp: 32000000, brandId: brandLV.id, seasonGroupId: 'SS' },
    { skuCode: 'LV-SLG-001', productName: 'Zippy Wallet Monogram', productType: 'SLG', theme: 'Carryover', color: 'Monogram', composition: 'Monogram Canvas', srp: 22000000, brandId: brandLV.id },
    { skuCode: 'LV-SLG-002', productName: 'Card Holder Damier', productType: 'SLG', theme: 'Carryover', color: 'Damier Ebene', composition: 'Damier Canvas', srp: 8500000, brandId: brandLV.id },
    { skuCode: 'LV-ACC-001', productName: 'Initiales Belt 40mm', productType: 'M ACCESSORIES', theme: 'Carryover', color: 'Monogram/Nero', composition: 'Monogram Canvas', srp: 16000000, brandId: brandLV.id },

    // === DOLCE & GABBANA (8 SKUs) ===
    { skuCode: 'DG-BAG-001', productName: 'Sicily Medium', productType: 'W BAGS', theme: 'SS24 Main', color: 'Nero', composition: 'Dauphine Leather', srp: 55000000, brandId: brandDG.id, seasonGroupId: 'SS' },
    { skuCode: 'DG-BAG-002', productName: 'Devotion Crossbody', productType: 'W BAGS', theme: 'SS25 Main', color: 'Rosso', composition: 'Quilted Nappa', srp: 48000000, brandId: brandDG.id, seasonGroupId: 'SS' },
    { skuCode: 'DG-RTW-001', productName: 'Lace Midi Dress', productType: 'W DRESSES', theme: 'SS25 Main', color: 'Nero', composition: 'Cotton Lace', srp: 98000000, brandId: brandDG.id, seasonGroupId: 'SS' },
    { skuCode: 'DG-RTW-002', productName: 'Brocade Blazer', productType: 'M OUTERWEAR', theme: 'FW25 Main', color: 'Gold/Nero', composition: 'Silk Brocade', srp: 120000000, brandId: brandDG.id, seasonGroupId: 'FW' },
    { skuCode: 'DG-RTW-003', productName: 'Silk Printed Shirt', productType: 'M TOPS', theme: 'SS25 Main', color: 'Maiolica Print', composition: '100% Silk Twill', srp: 38000000, brandId: brandDG.id, seasonGroupId: 'SS' },
    { skuCode: 'DG-SHO-001', productName: 'DG Logo Pump', productType: 'W SHOES', theme: 'SS24 Main', color: 'Nero', composition: 'Patent Leather', srp: 28000000, brandId: brandDG.id, seasonGroupId: 'SS' },
    { skuCode: 'DG-ACC-001', productName: 'Crown Buckle Belt', productType: 'M ACCESSORIES', theme: 'Carryover', color: 'Nero', composition: 'Leather + Metal', srp: 18000000, brandId: brandDG.id },
    { skuCode: 'DG-SLG-001', productName: 'DG Logo Wallet', productType: 'SLG', theme: 'Carryover', color: 'Nero', composition: 'Dauphine Leather', srp: 14000000, brandId: brandDG.id },

    // === VERSACE (8 SKUs) ===
    { skuCode: 'VER-BAG-001', productName: 'La Medusa Medium', productType: 'W BAGS', theme: 'SS24 Main', color: 'Nero', composition: 'Calf Leather', srp: 58000000, brandId: brandVER.id, seasonGroupId: 'SS' },
    { skuCode: 'VER-BAG-002', productName: 'Virtus Shoulder Bag', productType: 'W BAGS', theme: 'FW24 Main', color: 'Nero', composition: 'Quilted Leather', srp: 65000000, brandId: brandVER.id, seasonGroupId: 'FW' },
    { skuCode: 'VER-RTW-001', productName: 'Medusa Chain Dress', productType: 'W DRESSES', theme: 'SS25 Main', color: 'Versace Gold', composition: 'Silk Blend', srp: 85000000, brandId: brandVER.id, seasonGroupId: 'SS' },
    { skuCode: 'VER-RTW-002', productName: 'Greca Border Jacket', productType: 'M OUTERWEAR', theme: 'FW25 Main', color: 'Nero', composition: 'Wool Blend', srp: 95000000, brandId: brandVER.id, seasonGroupId: 'FW' },
    { skuCode: 'VER-RTW-003', productName: 'Barocco Silk Shirt', productType: 'M TOPS', theme: 'SS25 Main', color: 'Gold Print', composition: '100% Silk Twill', srp: 42000000, brandId: brandVER.id, seasonGroupId: 'SS' },
    { skuCode: 'VER-SHO-001', productName: 'Platform Medusa Pump', productType: 'W SHOES', theme: 'SS25 Main', color: 'Nero', composition: 'Satin + Crystal', srp: 35000000, brandId: brandVER.id, seasonGroupId: 'SS' },
    { skuCode: 'VER-ACC-001', productName: 'Medusa Head Belt', productType: 'M ACCESSORIES', theme: 'Carryover', color: 'Nero/Gold', composition: 'Leather + Metal', srp: 15000000, brandId: brandVER.id },
    { skuCode: 'VER-SLG-001', productName: 'Medusa Biggie Card Case', productType: 'SLG', theme: 'Carryover', color: 'Nero', composition: 'Calf Leather', srp: 8500000, brandId: brandVER.id },

    // === BALENCIAGA (8 SKUs) ===
    { skuCode: 'BAL-BAG-001', productName: 'Le City Medium', productType: 'W BAGS', theme: 'Carryover', color: 'Nero', composition: 'Arena Leather', srp: 62000000, brandId: brandBAL.id },
    { skuCode: 'BAL-BAG-002', productName: 'Hourglass XS Bag', productType: 'W BAGS', theme: 'SS25 Main', color: 'Bright Red', composition: 'Shiny Calfskin', srp: 52000000, brandId: brandBAL.id, seasonGroupId: 'SS' },
    { skuCode: 'BAL-RTW-001', productName: 'Oversized Denim Jacket', productType: 'W OUTERWEAR', theme: 'SS25 Main', color: 'Washed Blue', composition: '100% Cotton Denim', srp: 48000000, brandId: brandBAL.id, seasonGroupId: 'SS' },
    { skuCode: 'BAL-RTW-002', productName: 'Political Campaign Hoodie', productType: 'M TOPS', theme: 'FW25 Main', color: 'Black', composition: '100% Cotton Fleece', srp: 32000000, brandId: brandBAL.id, seasonGroupId: 'FW' },
    { skuCode: 'BAL-RTW-003', productName: 'Destroyed Tailored Blazer', productType: 'M OUTERWEAR', theme: 'FW24 Main', color: 'Navy', composition: 'Wool Twill', srp: 85000000, brandId: brandBAL.id, seasonGroupId: 'FW' },
    { skuCode: 'BAL-SHO-001', productName: 'Track Runner Sneaker', productType: 'W SHOES', theme: 'SS24 Main', color: 'Multi', composition: 'Mesh + Nylon', srp: 28000000, brandId: brandBAL.id, seasonGroupId: 'SS' },
    { skuCode: 'BAL-ACC-001', productName: 'BB Logo Belt', productType: 'M ACCESSORIES', theme: 'Carryover', color: 'Nero', composition: 'Leather + Metal', srp: 12000000, brandId: brandBAL.id },
    { skuCode: 'BAL-SLG-001', productName: 'Cash Mini Wallet', productType: 'SLG', theme: 'Carryover', color: 'Nero', composition: 'Arena Leather', srp: 9800000, brandId: brandBAL.id },

    // === Additional FER SKUs for 2025 ===
    { skuCode: 'FER-BAG-006', productName: 'Hug Bag Small', productType: 'W BAGS', theme: 'SS25 Main', color: 'Caramel', composition: 'Calfskin Leather', srp: 42000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-BAG-007', productName: 'Varina Clutch', productType: 'W BAGS', theme: 'FW25 Main', color: 'Gold', composition: 'Metallic Leather', srp: 28000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-RTW-005', productName: 'Knit Polo Shirt', productType: 'M TOPS', theme: 'SS25 Main', color: 'Navy', composition: 'Cotton Piqué', srp: 18000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-RTW-006', productName: 'Gancini Bomber Jacket', productType: 'M OUTERWEAR', theme: 'FW25 Main', color: 'Nero', composition: 'Nylon + Leather', srp: 68000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // === Additional BUR SKUs for 2025 ===
    { skuCode: 'BUR-BAG-003', productName: 'Pocket Bag Medium', productType: 'W BAGS', theme: 'SS25 Main', color: 'Archive Beige', composition: 'Cotton Canvas', srp: 52000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    { skuCode: 'BUR-RTW-002', productName: 'Check Wool Skirt', productType: 'W BOTTOMS', theme: 'FW25 Main', color: 'Archive Beige', composition: 'Wool Check', srp: 32000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
    { skuCode: 'BUR-RTW-003', productName: 'TB Monogram Polo', productType: 'M TOPS', theme: 'SS25 Main', color: 'White', composition: 'Cotton Piqué', srp: 22000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    { skuCode: 'BUR-SHO-002', productName: 'Check Rubber Boot', productType: 'W SHOES', theme: 'FW25 Main', color: 'Archive Beige', composition: 'Rubber', srp: 18000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
    // === Additional GUC SKUs ===
    { skuCode: 'GUC-BAG-003', productName: 'Jackie 1961 Small', productType: 'W BAGS', theme: 'FW24 Main', color: 'Nero', composition: 'Leather', srp: 55000000, brandId: brandGUC.id, seasonGroupId: 'FW' },
    { skuCode: 'GUC-RTW-001', productName: 'GG Canvas Jacket', productType: 'W OUTERWEAR', theme: 'SS25 Main', color: 'Beige/Ebony', composition: 'GG Canvas', srp: 72000000, brandId: brandGUC.id, seasonGroupId: 'SS' },
    { skuCode: 'GUC-RTW-002', productName: 'Horsebit Loafer Men', productType: 'M SHOES', theme: 'Carryover', color: 'Nero', composition: 'Calfskin', srp: 32000000, brandId: brandGUC.id },
    { skuCode: 'GUC-SLG-001', productName: 'GG Marmont Card Case', productType: 'SLG', theme: 'Carryover', color: 'Nero', composition: 'Matelassé Leather', srp: 8500000, brandId: brandGUC.id },

    // === Keep existing SKUs from old seed (Burberry detailed) ===
    { skuCode: '8116333', productName: 'FITZROVIA DK SHT', productType: 'W OUTERWEAR', theme: 'AUGUST (08)', color: 'WINE RED', composition: '100% COTTON', srp: 87900000, brandId: brandBUR.id },
    { skuCode: '8113543', productName: 'FLORISTON S', productType: 'W OUTERWEAR', theme: 'AUGUST (08)', color: 'MAHOGANY', composition: '100% POLYAMIDE (NYLON)', srp: 65900000, brandId: brandBUR.id },
    { skuCode: '8115960', productName: 'OLDHAM CHK', productType: 'W OUTERWEAR', theme: 'AUGUST (08)', color: 'POPPY IP CHECK', composition: '100% COTTON', srp: 71900000, brandId: brandBUR.id },
    { skuCode: '8116500', productName: 'KENSINGTON TRENCH', productType: 'W OUTERWEAR', theme: 'SEPTEMBER (09)', color: 'HONEY', composition: '100% COTTON', srp: 95000000, brandId: brandBUR.id },
    { skuCode: '8116501', productName: 'CHELSEA COAT', productType: 'W OUTERWEAR', theme: 'SEPTEMBER (09)', color: 'BLACK', composition: '80% WOOL 20% CASHMERE', srp: 120000000, brandId: brandBUR.id },
    { skuCode: '8114202', productName: 'GILLIAN WCHK', productType: 'W TOPS', theme: 'SEPTEMBER (09)', color: 'TRUFFLE IP CHECK', composition: '70% WOOL 30% CASHMERE', srp: 49900000, brandId: brandBUR.id },
    { skuCode: '8115254', productName: 'GEORGETTE WCHK', productType: 'W TOPS', theme: 'SEPTEMBER (09)', color: 'TRUFFLE IP CHECK', composition: '70% WOOL 30% CASHMERE', srp: 58900000, brandId: brandBUR.id },
    { skuCode: '8115640', productName: 'SCARLETT EKD', productType: 'W TOPS', theme: 'SEPTEMBER (09)', color: 'CAMEL', composition: '70% WOOL 30% CASHMERE', srp: 44900000, brandId: brandBUR.id },
    { skuCode: '8115700', productName: 'VICTORIA BLOUSE', productType: 'W TOPS', theme: 'OCTOBER (10)', color: 'IVORY', composition: '100% SILK', srp: 38000000, brandId: brandBUR.id },
    { skuCode: '8115701', productName: 'EMMA SHIRT', productType: 'W TOPS', theme: 'OCTOBER (10)', color: 'WHITE', composition: '100% COTTON', srp: 28000000, brandId: brandBUR.id },
    { skuCode: '9201001', productName: 'HERITAGE TOTE', productType: 'M BAGS', theme: 'OCTOBER (10)', color: 'BLACK', composition: '100% LEATHER', srp: 65000000, brandId: brandBUR.id },
    { skuCode: '9201002', productName: 'MESSENGER BAG', productType: 'M BAGS', theme: 'OCTOBER (10)', color: 'TAN', composition: '100% LEATHER', srp: 55000000, brandId: brandBUR.id },
    { skuCode: '9201003', productName: 'BACKPACK CLASSIC', productType: 'M BAGS', theme: 'NOVEMBER (11)', color: 'NAVY', composition: '100% NYLON', srp: 42000000, brandId: brandBUR.id },
    { skuCode: '9101001', productName: 'LOLA BAG', productType: 'W BAGS', theme: 'AUGUST (08)', color: 'BURGUNDY', composition: '100% LEATHER', srp: 78000000, brandId: brandBUR.id },
    { skuCode: '9101002', productName: 'TB BAG SMALL', productType: 'W BAGS', theme: 'SEPTEMBER (09)', color: 'BLACK', composition: '100% LEATHER', srp: 95000000, brandId: brandBUR.id },
  ];

  for (const sku of skuData) {
    await prisma.skuCatalog.upsert({
      where: { skuCode: sku.skuCode },
      update: { brandId: sku.brandId },
      create: sku,
    });
  }
  console.log(`  ✅ ${skuData.length} SKUs`);

  // ─── USERS ──────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('dafc@2026', 12);
  const allStoreIds = stores.map(s => s.id);
  const allBrandIds = brands.map(b => b.id);
  const ferBurIds = [brandFER.id, brandBUR.id];
  const gucPraIds = [brandGUC.id, brandPRA.id];

  const users = await Promise.all([
    // Admin
    prisma.user.upsert({
      where: { email: 'admin@dafc.com' },
      update: {},
      create: {
        email: 'admin@dafc.com', name: 'Nguyễn Văn Admin',
        passwordHash: password, roleId: adminRole.id,
        storeAccess: allStoreIds, brandAccess: allBrandIds,
      },
    }),
    // Senior Buyer (Ferragamo + Burberry)
    prisma.user.upsert({
      where: { email: 'buyer@dafc.com' },
      update: {},
      create: {
        email: 'buyer@dafc.com', name: 'Lê Văn Buyer',
        passwordHash: password, roleId: buyerRole.id,
        storeAccess: allStoreIds, brandAccess: ferBurIds,
      },
    }),
    // Junior Buyer (Gucci + Prada)
    prisma.user.upsert({
      where: { email: 'buyer.junior@dafc.com' },
      update: {},
      create: {
        email: 'buyer.junior@dafc.com', name: 'Phạm Thị Junior',
        passwordHash: password, roleId: buyerRole.id,
        storeAccess: allStoreIds, brandAccess: gucPraIds,
      },
    }),
    // Merchandiser / Planner
    prisma.user.upsert({
      where: { email: 'merch@dafc.com' },
      update: {},
      create: {
        email: 'merch@dafc.com', name: 'Hoàng Văn Planner',
        passwordHash: password, roleId: merchRole.id,
        storeAccess: allStoreIds, brandAccess: allBrandIds,
      },
    }),
    // Merch Manager (L1 Approver)
    prisma.user.upsert({
      where: { email: 'manager@dafc.com' },
      update: {},
      create: {
        email: 'manager@dafc.com', name: 'Trần Thị Manager',
        passwordHash: password, roleId: merchMgrRole.id,
        storeAccess: allStoreIds, brandAccess: allBrandIds,
      },
    }),
    // Finance Director (L2 Approver)
    prisma.user.upsert({
      where: { email: 'finance@dafc.com' },
      update: {},
      create: {
        email: 'finance@dafc.com', name: 'Pham Director',
        passwordHash: password, roleId: finDirRole.id,
        storeAccess: allStoreIds, brandAccess: allBrandIds,
      },
    }),
    // Store Manager REX
    prisma.user.upsert({
      where: { email: 'store.rex@dafc.com' },
      update: {},
      create: {
        email: 'store.rex@dafc.com', name: 'Ngô Thị Store REX',
        passwordHash: password, roleId: buyerRole.id,
        storeAccess: [storeREX.id, storeDN.id], brandAccess: allBrandIds,
      },
    }),
    // Store Manager TTP
    prisma.user.upsert({
      where: { email: 'store.ttp@dafc.com' },
      update: {},
      create: {
        email: 'store.ttp@dafc.com', name: 'Đỗ Văn TTP',
        passwordHash: password, roleId: buyerRole.id,
        storeAccess: [storeTTP.id, storeHP.id], brandAccess: allBrandIds,
      },
    }),
  ]);
  const adminUser = users[0];
  const buyerUser = users[1];
  const merchUser = users[3];
  console.log(`  ✅ ${users.length} users (password: dafc@2026)`);

  // ─── BUDGETS (3 Years × 2 Seasons × Multiple Brands) ───────────────────
  type BudgetSpec = {
    code: string;
    brandId: string;
    season: string;
    type: string;
    year: number;
    total: number;
    status: 'DRAFT' | 'SUBMITTED' | 'LEVEL1_APPROVED' | 'APPROVED' | 'REJECTED';
  };

  const budgetSpecs: BudgetSpec[] = [
    // 2023
    { code: 'BUD-FER-SS-pre-2023', brandId: brandFER.id, season: 'SS', type: 'pre', year: 2023, total: 1400000000, status: 'APPROVED' },
    { code: 'BUD-FER-SS-main-2023', brandId: brandFER.id, season: 'SS', type: 'main', year: 2023, total: 2100000000, status: 'APPROVED' },
    { code: 'BUD-FER-FW-pre-2023', brandId: brandFER.id, season: 'FW', type: 'pre', year: 2023, total: 1470000000, status: 'APPROVED' },
    { code: 'BUD-FER-FW-main-2023', brandId: brandFER.id, season: 'FW', type: 'main', year: 2023, total: 2730000000, status: 'APPROVED' },
    { code: 'BUD-BUR-SS-pre-2023', brandId: brandBUR.id, season: 'SS', type: 'pre', year: 2023, total: 1260000000, status: 'APPROVED' },
    { code: 'BUD-BUR-SS-main-2023', brandId: brandBUR.id, season: 'SS', type: 'main', year: 2023, total: 1540000000, status: 'APPROVED' },
    // 2024
    { code: 'BUD-FER-SS-pre-2024', brandId: brandFER.id, season: 'SS', type: 'pre', year: 2024, total: 1520000000, status: 'APPROVED' },
    { code: 'BUD-FER-SS-main-2024', brandId: brandFER.id, season: 'SS', type: 'main', year: 2024, total: 2280000000, status: 'APPROVED' },
    { code: 'BUD-FER-FW-pre-2024', brandId: brandFER.id, season: 'FW', type: 'pre', year: 2024, total: 1710000000, status: 'APPROVED' },
    { code: 'BUD-FER-FW-main-2024', brandId: brandFER.id, season: 'FW', type: 'main', year: 2024, total: 2790000000, status: 'APPROVED' },
    { code: 'BUD-BUR-FW-main-2024', brandId: brandBUR.id, season: 'FW', type: 'main', year: 2024, total: 1800000000, status: 'APPROVED' },
    { code: 'BUD-GUC-SS-main-2024', brandId: brandGUC.id, season: 'SS', type: 'main', year: 2024, total: 1200000000, status: 'APPROVED' },
    // 2025
    { code: 'BUD-FER-SS-pre-2025', brandId: brandFER.id, season: 'SS', type: 'pre', year: 2025, total: 1680000000, status: 'APPROVED' },
    { code: 'BUD-FER-SS-main-2025', brandId: brandFER.id, season: 'SS', type: 'main', year: 2025, total: 2320000000, status: 'APPROVED' },
    { code: 'BUD-FER-FW-pre-2025', brandId: brandFER.id, season: 'FW', type: 'pre', year: 2025, total: 1920000000, status: 'LEVEL1_APPROVED' },
    { code: 'BUD-FER-FW-main-2025', brandId: brandFER.id, season: 'FW', type: 'main', year: 2025, total: 2880000000, status: 'DRAFT' },
    { code: 'BUD-BUR-SS-main-2025', brandId: brandBUR.id, season: 'SS', type: 'main', year: 2025, total: 1600000000, status: 'APPROVED' },
    { code: 'BUD-BUR-FW-main-2025', brandId: brandBUR.id, season: 'FW', type: 'main', year: 2025, total: 1850000000, status: 'SUBMITTED' },
    { code: 'BUD-GUC-SS-main-2025', brandId: brandGUC.id, season: 'SS', type: 'main', year: 2025, total: 1350000000, status: 'APPROVED' },
    { code: 'BUD-PRA-FW-main-2025', brandId: brandPRA.id, season: 'FW', type: 'main', year: 2025, total: 800000000, status: 'DRAFT' },
  ];

  const createdBudgets: any[] = [];
  for (const spec of budgetSpecs) {
    const budget = await prisma.budget.upsert({
      where: { budgetCode: spec.code },
      update: { totalBudget: spec.total, status: spec.status },
      create: {
        budgetCode: spec.code,
        groupBrandId: spec.brandId,
        seasonGroupId: spec.season,
        seasonType: spec.type,
        fiscalYear: spec.year,
        totalBudget: spec.total,
        status: spec.status,
        createdById: merchUser.id,
      },
    });
    createdBudgets.push(budget);
  }
  console.log(`  ✅ ${createdBudgets.length} budgets (2023-2025)`);

  // ─── BUDGET DETAILS (per-store allocation) ──────────────────────────────
  let budgetDetailCount = 0;
  for (const budget of createdBudgets) {
    const halfBudget = Number(budget.totalBudget) / 2;
    for (const store of [storeREX, storeTTP]) {
      await prisma.budgetDetail.upsert({
        where: {
          budgetId_storeId: { budgetId: budget.id, storeId: store.id },
        },
        update: { budgetAmount: halfBudget },
        create: {
          budgetId: budget.id,
          storeId: store.id,
          budgetAmount: halfBudget,
        },
      });
      budgetDetailCount++;
    }
  }
  console.log(`  ✅ ${budgetDetailCount} budget details`);

  // ─── PLANNING VERSIONS (for approved/L1 budgets across all years) ─────
  const budgetsWithPlanning = createdBudgets.filter(b =>
    b.status === 'APPROVED' || b.status === 'LEVEL1_APPROVED'
  );

  let planningCount = 0;
  for (const budget of budgetsWithPlanning) {
    // Get budget details for this budget
    const details = await prisma.budgetDetail.findMany({
      where: { budgetId: budget.id },
    });
    for (const detail of details) {
      const store = stores.find(s => s.id === detail.storeId);
      const storeCode = store?.code || 'UNK';
      const planCode = `PLN-${budget.budgetCode}-${storeCode}-V1`;

      await prisma.planningVersion.upsert({
        where: { planningCode: planCode },
        update: {},
        create: {
          planningCode: planCode,
          budgetDetailId: detail.id,
          versionNumber: 1,
          versionName: 'Initial Planning',
          status: budget.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
          createdById: merchUser.id,
        },
      });
      planningCount++;
    }
  }
  console.log(`  ✅ ${planningCount} planning versions`);

  // ─── PLANNING DETAILS (per planning version) ─────────────────────────
  // Create detail rows for each planning version across dimensions
  const allPlanningVersions = await prisma.planningVersion.findMany();
  const allCollections = await prisma.collection.findMany();
  const allGenders = await prisma.gender.findMany();
  const allCategories = await prisma.category.findMany();
  const allSubCategories = await prisma.subCategory.findMany();

  let planningDetailCount = 0;
  for (const pv of allPlanningVersions) {
    const budgetDetail = await prisma.budgetDetail.findUnique({ where: { id: pv.budgetDetailId } });
    const totalBudget = budgetDetail ? Number(budgetDetail.budgetAmount) : 500000000;

    // Collection dimension (2 rows)
    for (let i = 0; i < allCollections.length; i++) {
      const pct = i === 0 ? 0.35 : 0.65; // 35% carry-over, 65% seasonal
      await prisma.planningDetail.create({
        data: {
          planningVersionId: pv.id,
          dimensionType: 'collection',
          collectionId: allCollections[i].id,
          lastSeasonSales: totalBudget * pct * 0.9,
          lastSeasonPct: pct * 100,
          systemBuyPct: pct * 100,
          userBuyPct: pct * 100 + (Math.random() * 4 - 2),
          otbValue: totalBudget * pct,
          variancePct: Math.random() * 6 - 3,
        },
      });
      planningDetailCount++;
    }

    // Gender dimension (2 rows)
    for (let i = 0; i < allGenders.length; i++) {
      const pct = i === 0 ? 0.6 : 0.4; // 60% Female, 40% Male
      await prisma.planningDetail.create({
        data: {
          planningVersionId: pv.id,
          dimensionType: 'gender',
          genderId: allGenders[i].id,
          lastSeasonSales: totalBudget * pct * 0.88,
          lastSeasonPct: pct * 100,
          systemBuyPct: pct * 100,
          userBuyPct: pct * 100 + (Math.random() * 4 - 2),
          otbValue: totalBudget * pct,
          variancePct: Math.random() * 6 - 3,
        },
      });
      planningDetailCount++;
    }

    // Category dimension (all categories)
    const catPcts = [0.30, 0.20, 0.30, 0.12, 0.04, 0.02, 0.01, 0.01];
    for (let i = 0; i < allCategories.length; i++) {
      const pct = catPcts[i] || 0.05;
      await prisma.planningDetail.create({
        data: {
          planningVersionId: pv.id,
          dimensionType: 'category',
          categoryId: allCategories[i].id,
          genderId: allCategories[i].genderId,
          lastSeasonSales: totalBudget * pct * 0.92,
          lastSeasonPct: pct * 100,
          systemBuyPct: pct * 100,
          userBuyPct: pct * 100 + (Math.random() * 4 - 2),
          otbValue: totalBudget * pct,
          variancePct: Math.random() * 8 - 4,
        },
      });
      planningDetailCount++;
    }
  }
  console.log(`  ✅ ${planningDetailCount} planning details`);

  // ─── PROPOSALS (10 across brands & seasons) ───────────────────────────
  const proposalSpecs = [
    { id: 'prop-fer-ss25-001', ticket: 'FER SS25 Main — Bags & Shoes Selection', budgetCode: 'BUD-FER-SS-main-2025', status: 'APPROVED' as const, skuCount: 8, qty: 240, value: 580000000 },
    { id: 'prop-fer-ss25-002', ticket: 'FER SS25 Pre — RTW Selection', budgetCode: 'BUD-FER-SS-pre-2025', status: 'APPROVED' as const, skuCount: 5, qty: 150, value: 420000000 },
    { id: 'prop-fer-fw25-001', ticket: 'FER FW25 Pre — Pre-Season Selection', budgetCode: 'BUD-FER-FW-pre-2025', status: 'DRAFT' as const, skuCount: 6, qty: 180, value: 384000000 },
    { id: 'prop-fer-fw24-001', ticket: 'FER FW24 Main — Full Collection', budgetCode: 'BUD-FER-FW-main-2024', status: 'APPROVED' as const, skuCount: 10, qty: 300, value: 750000000 },
    { id: 'prop-bur-ss25-001', ticket: 'BUR SS25 Main — Full Collection', budgetCode: 'BUD-BUR-SS-main-2025', status: 'SUBMITTED' as const, skuCount: 12, qty: 360, value: 720000000 },
    { id: 'prop-bur-fw25-001', ticket: 'BUR FW25 Main — Seasonal Buy', budgetCode: 'BUD-BUR-FW-main-2025', status: 'DRAFT' as const, skuCount: 8, qty: 200, value: 480000000 },
    { id: 'prop-bur-fw24-001', ticket: 'BUR FW24 Main — Heritage Line', budgetCode: 'BUD-BUR-FW-main-2024', status: 'APPROVED' as const, skuCount: 7, qty: 210, value: 560000000 },
    { id: 'prop-guc-ss25-001', ticket: 'GUC SS25 Main — Bags & Accessories', budgetCode: 'BUD-GUC-SS-main-2025', status: 'LEVEL1_APPROVED' as const, skuCount: 4, qty: 120, value: 350000000 },
    { id: 'prop-guc-ss24-001', ticket: 'GUC SS24 Main — Full Collection', budgetCode: 'BUD-GUC-SS-main-2024', status: 'APPROVED' as const, skuCount: 4, qty: 100, value: 280000000 },
    { id: 'prop-pra-fw25-001', ticket: 'PRA FW25 Main — Launch Collection', budgetCode: 'BUD-PRA-FW-main-2025', status: 'DRAFT' as const, skuCount: 5, qty: 150, value: 320000000 },
  ];

  const createdProposals: any[] = [];
  for (const spec of proposalSpecs) {
    const budget = createdBudgets.find(b => b.budgetCode === spec.budgetCode);
    if (!budget) continue;
    const proposal = await prisma.proposal.create({
      data: {
        id: spec.id,
        ticketName: spec.ticket,
        budgetId: budget.id,
        status: spec.status,
        totalSkuCount: spec.skuCount,
        totalOrderQty: spec.qty,
        totalValue: spec.value,
        createdById: buyerUser.id,
      },
    });
    createdProposals.push(proposal);
  }
  console.log(`  ✅ ${createdProposals.length} proposals`);

  // ─── PROPOSAL PRODUCTS + ALLOCATIONS ──────────────────────────────────
  // Map proposals to SKU codes that make sense for each brand
  const proposalSkuMap: Record<string, string[]> = {
    'prop-fer-ss25-001': ['FER-BAG-001', 'FER-BAG-002', 'FER-BAG-003', 'FER-BAG-004', 'FER-SHO-001', 'FER-SHO-002', 'FER-SHO-004', 'FER-ACC-002'],
    'prop-fer-ss25-002': ['FER-RTW-001', 'FER-RTW-004', 'FER-ACC-003', 'FER-SLG-001', 'FER-SLG-002'],
    'prop-fer-fw25-001': ['FER-BAG-005', 'FER-SHO-005', 'FER-RTW-002', 'FER-RTW-003', 'FER-RTW-004', 'FER-SLG-003'],
    'prop-fer-fw24-001': ['FER-BAG-001', 'FER-BAG-005', 'FER-SHO-001', 'FER-SHO-005', 'FER-RTW-002', 'FER-RTW-003', 'FER-ACC-001', 'FER-SLG-001', 'FER-SLG-002', 'FER-SLG-003'],
    'prop-bur-ss25-001': ['BUR-BAG-001', 'BUR-BAG-002', 'BUR-SHO-001', 'BUR-RTW-001', 'BUR-ACC-001', '8116333', '8113543', '8115960', '8114202', '8115254', '8115640', '8115700'],
    'prop-bur-fw25-001': ['BUR-RTW-001', 'BUR-ACC-001', '8116500', '8116501', '8115701', '9201001', '9201002', '9201003'],
    'prop-bur-fw24-001': ['9101001', '9101002', '9201001', '9201002', '9201003', '8116500', '8116501'],
    'prop-guc-ss25-001': ['GUC-BAG-001', 'GUC-BAG-002', 'GUC-SHO-001', 'GUC-ACC-001'],
    'prop-guc-ss24-001': ['GUC-BAG-001', 'GUC-BAG-002', 'GUC-SHO-001', 'GUC-ACC-001'],
    'prop-pra-fw25-001': ['PRA-BAG-001', 'PRA-BAG-003', 'PRA-RTW-001', 'PRA-RTW-004', 'PRA-SHO-001'],
  };

  // Build a lookup from skuCode → sku record
  const allSkus = await prisma.skuCatalog.findMany();
  const skuByCode: Record<string, any> = {};
  for (const s of allSkus) skuByCode[s.skuCode] = s;

  let totalProposalProducts = 0;
  let totalAllocations = 0;

  for (const proposal of createdProposals) {
    const skuCodes = proposalSkuMap[proposal.id] || [];
    let sortOrder = 1;
    for (const code of skuCodes) {
      const sku = skuByCode[code];
      if (!sku) continue;
      const orderQty = Math.floor(Math.random() * 20) + 10; // 10-29 units
      const unitCost = Number(sku.srp) * 0.45; // ~45% of SRP
      const product = await prisma.proposalProduct.create({
        data: {
          proposalId: proposal.id,
          skuId: sku.id,
          skuCode: sku.skuCode,
          productName: sku.productName,
          collection: sku.theme?.includes('Carryover') || sku.theme?.includes('arryover') ? 'Carry Over' : 'Seasonal',
          gender: sku.productType?.startsWith('W') ? 'Female' : 'Male',
          category: sku.productType,
          subCategory: sku.productType,
          theme: sku.theme,
          color: sku.color,
          composition: sku.composition,
          unitCost: unitCost,
          srp: Number(sku.srp),
          orderQty: orderQty,
          totalValue: unitCost * orderQty,
          customerTarget: ['New', 'Existing', 'VIP'][Math.floor(Math.random() * 3)],
          sortOrder: sortOrder++,
        },
      });
      totalProposalProducts++;

      // Allocations: REX 60%, TTP 40%
      const rexQty = Math.round(orderQty * 0.6);
      const ttpQty = orderQty - rexQty;
      await prisma.productAllocation.create({
        data: { proposalProductId: product.id, storeId: storeREX.id, quantity: rexQty },
      });
      await prisma.productAllocation.create({
        data: { proposalProductId: product.id, storeId: storeTTP.id, quantity: ttpQty },
      });
      totalAllocations += 2;
    }
  }
  console.log(`  ✅ ${totalProposalProducts} proposal products`);
  console.log(`  ✅ ${totalAllocations} product allocations`);

  // ─── APPROVALS (for approved budgets) ───────────────────────────────────
  const approvedBudgets = createdBudgets.filter(b => b.status === 'APPROVED');
  let approvalCount = 0;
  const managerUser = users[4]; // manager@dafc.com
  const financeUser = users[5]; // finance@dafc.com

  for (const budget of approvedBudgets) {
    // L1 approval
    const l1Id = `appr-l1-${budget.budgetCode}`;
    await prisma.approval.upsert({
      where: { id: l1Id },
      update: {},
      create: {
        id: l1Id,
        entityType: 'budget',
        entityId: budget.id,
        level: 1,
        deciderId: managerUser.id,
        action: 'APPROVED',
        comment: 'Budget approved — within target margins',
      },
    });
    // L2 approval
    const l2Id = `appr-l2-${budget.budgetCode}`;
    await prisma.approval.upsert({
      where: { id: l2Id },
      update: {},
      create: {
        id: l2Id,
        entityType: 'budget',
        entityId: budget.id,
        level: 2,
        deciderId: financeUser.id,
        action: 'APPROVED',
        comment: 'Final approval granted',
      },
    });
    approvalCount += 2;
  }
  console.log(`  ✅ ${approvalCount} approval records`);

  // (AI-related seed data removed: salesHistory, allocationHistory, skuPerformance, attributeTrend, budgetSnapshot, budgetAlert)
  // ─── APPROVAL WORKFLOW STEPS ────────────────────────────────────────────
  for (const brand of [brandFER, brandBUR, brandGUC, brandPRA]) {
    await prisma.approvalWorkflowStep.upsert({
      where: { brandId_stepNumber: { brandId: brand.id, stepNumber: 1 } },
      update: {},
      create: {
        brandId: brand.id,
        stepNumber: 1,
        roleName: 'Merchandising Manager',
        roleCode: 'merch_manager',
        userId: managerUser.id,
        description: 'Level 1 — Merchandising Manager review',
      },
    });
    await prisma.approvalWorkflowStep.upsert({
      where: { brandId_stepNumber: { brandId: brand.id, stepNumber: 2 } },
      update: {},
      create: {
        brandId: brand.id,
        stepNumber: 2,
        roleName: 'Finance Director',
        roleCode: 'finance_director',
        userId: financeUser.id,
        description: 'Level 2 — Finance Director final approval',
      },
    });
  }
  console.log('  ✅ 8 approval workflow steps');

  // ─── SUMMARY ────────────────────────────────────────────────────────────
  console.log('');
  console.log('═'.repeat(60));
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Roles:              ${roles.length}`);
  console.log(`   Stores:             ${stores.length}`);
  console.log(`   Brands:             ${brands.length}`);
  console.log(`   Categories:         ${allCategories.length}`);
  console.log(`   Sub-categories:     ${subCategories.length}`);
  console.log(`   SKUs:               ${skuData.length}`);
  console.log(`   Users:              ${users.length}`);
  console.log(`   Budgets:            ${createdBudgets.length}`);
  console.log(`   Budget Details:     ${budgetDetailCount}`);
  console.log(`   Planning Versions:  ${planningCount}`);
  console.log(`   Planning Details:   ${planningDetailCount}`);
  console.log(`   Proposals:          ${createdProposals.length}`);
  console.log(`   Proposal Products:  ${totalProposalProducts}`);
  console.log(`   Prod. Allocations:  ${totalAllocations}`);
  console.log(`   Approvals:          ${approvalCount}`);
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('   admin@dafc.com      / dafc@2026 (Admin)');
  console.log('   buyer@dafc.com      / dafc@2026 (Senior Buyer - FER/BUR)');
  console.log('   buyer.junior@dafc.com / dafc@2026 (Junior Buyer - GUC/PRA)');
  console.log('   merch@dafc.com      / dafc@2026 (Merchandiser/Planner)');
  console.log('   manager@dafc.com    / dafc@2026 (L1 Approver)');
  console.log('   finance@dafc.com    / dafc@2026 (L2 Approver)');
  console.log('   store.rex@dafc.com  / dafc@2026 (REX Store)');
  console.log('   store.ttp@dafc.com  / dafc@2026 (TTP Store)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
