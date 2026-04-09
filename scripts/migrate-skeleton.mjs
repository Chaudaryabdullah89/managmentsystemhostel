#!/usr/bin/env node
/**
 * Batch migration script: replaces old Loader imports + usage with PageSkeleton variants.
 * Run: node scripts/migrate-skeleton.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve("app/(Dashboard)");

// Map of file paths (relative to ROOT) → skeleton variant to use
const migrations = [
  // ── Admin pages ──
  { file: "admin/reports/page.jsx", skeleton: "ReportSkeleton", import: '../../../../components/ui/Loader' },
  { file: "admin/services/page.jsx", skeleton: "GridPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/rooms/page.jsx", skeleton: "GridPageSkeleton", import: '../../../../../../components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/residents/page.jsx", skeleton: "ListPageSkeleton", import: '../../../../../../components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/residents/[residentId]/page.jsx", skeleton: "DetailPageSkeleton", import: '../../../../../../../components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/room-details/room/[roomId]/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/room-details/room/[roomId]/cleaning/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/room-details/room/[roomId]/maintenance/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/room-details/room/[roomId]/laundry/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/room-details/room/[roomId]/edit-room/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/hostels/[hostelId]/room-details/room/[roomId]/add-guest/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/users/[userId]/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/profile/page.jsx", skeleton: "ProfileSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/payment-analytics/page.jsx", skeleton: "ReportSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/leaves/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/mess/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/users-records/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/users-records/[userId]/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/warden-salaries/page.jsx", skeleton: "GridPageSkeleton", import: '@/components/ui/Loader' },
  { file: "admin/wardens/[id]/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },

  // ── Warden pages ──
  { file: "warden/page.jsx", skeleton: "DashboardSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/rooms/page.jsx", skeleton: "GridPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/cleaning/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/laundry/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/hostels/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/rooms/[roomId]/maintenance/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/rooms/[roomId]/laundry/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/rooms/[roomId]/cleaning/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/rooms/[roomId]/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/profile/page.jsx", skeleton: "ProfileSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/notices/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/expenses/page.jsx", skeleton: "CategoryPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/bookings/page.jsx", skeleton: "ListPageSkeleton", import: '../../../../components/ui/Loader' },
  { file: "warden/residents/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/residents/[residentId]/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/complaints/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/payments/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },
  { file: "warden/tasks/page.jsx", skeleton: "ListPageSkeleton", import: '@/components/ui/Loader' },

  // ── Staff pages ──
  { file: "staff/salary/page.jsx", skeleton: "GridPageSkeleton", import: '@/components/ui/Loader' },
  { file: "staff/profile/page.jsx", skeleton: "ProfileSkeleton", import: '@/components/ui/Loader' },

  // ── Guest pages ──
  { file: "guest/my-room/page.jsx", skeleton: "DetailPageSkeleton", import: '@/components/ui/Loader' },
];

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const { file, skeleton, import: oldImport } of migrations) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭  SKIP (not found): ${file}`);
    skipCount++;
    continue;
  }

  let content = fs.readFileSync(fullPath, "utf-8");

  // Check if already migrated
  if (content.includes("@/components/ui/skeletons")) {
    console.log(`✅ ALREADY DONE: ${file}`);
    skipCount++;
    continue;
  }

  // 1. Replace import
  const importPatterns = [
    `import Loader from "${oldImport}"`,
    `import Loader from "${oldImport}";`,
    `import Loader from '${oldImport}'`,
    `import Loader from '${oldImport}';`,
  ];

  let importReplaced = false;
  for (const pattern of importPatterns) {
    if (content.includes(pattern)) {
      content = content.replace(pattern, `import { ${skeleton} } from "@/components/ui/skeletons";`);
      importReplaced = true;
      break;
    }
  }

  if (!importReplaced) {
    console.log(`⚠️  IMPORT NOT FOUND: ${file} (looking for Loader from "${oldImport}")`);
    errorCount++;
    continue;
  }

  // 2. Replace usage: return <Loader ... /> patterns
  // Match: return <Loader ... />  or  return (<Loader ... />)
  const loaderUsageRegex = /return\s*\(?\s*<Loader[\s\S]*?\/>\s*\)?;?/g;
  const matches = content.match(loaderUsageRegex);
  
  if (matches && matches.length > 0) {
    content = content.replace(loaderUsageRegex, `return <${skeleton} />;`);
  } else {
    console.log(`⚠️  LOADER USAGE NOT FOUND: ${file}`);
    errorCount++;
    continue;
  }

  fs.writeFileSync(fullPath, content, "utf-8");
  console.log(`✅ MIGRATED: ${file} → ${skeleton}`);
  successCount++;
}

console.log(`\n━━━ MIGRATION COMPLETE ━━━`);
console.log(`✅ Migrated: ${successCount}`);
console.log(`⏭  Skipped:  ${skipCount}`);
console.log(`⚠️  Errors:   ${errorCount}`);
