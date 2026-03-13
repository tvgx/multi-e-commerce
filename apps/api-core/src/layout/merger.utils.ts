import { CustomerLayout, UIComponentRef } from '@ecommerce/schema';

/**
 * Merges an array of UI Components.
 * Tenant components override Master components by componentId.
 */
export function mergeComponentArrays(
  masterList: UIComponentRef[] = [],
  tenantList: UIComponentRef[] = [],
): UIComponentRef[] {
  const map = new Map<string, UIComponentRef>();

  // 1. Load Master Into Map
  masterList.forEach((c) => map.set(c.componentId, { ...c }));

  // 2. Apply Tenant Overrides / Additions
  tenantList.forEach((tenantC) => {
    if (map.has(tenantC.componentId)) {
      const masterC = map.get(tenantC.componentId)!;
      map.set(tenantC.componentId, {
        ...masterC,
        ...tenantC, // Overwrite isHidden, order etc.
        props: { ...masterC.props, ...tenantC.props }, // Shallow merge props
      });
    } else {
      map.set(tenantC.componentId, { ...tenantC });
    }
  });

  // 3. Filter Hidden and Sort by Order
  return Array.from(map.values())
    .filter((c) => !c.isHidden)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Core Algorithm: Merges a Tenant's Delta Layout with the Master Template Layout
 */
export function mergeLayouts(
  master: CustomerLayout,
  tenant: CustomerLayout,
): CustomerLayout {
  // If tenant is not inheriting, just return tenant.
  if (!tenant.baseLayoutId || !master) {
    return tenant;
  }

  // Merge Global (Header / Footer)
  const global = {
    header: mergeComponentArrays(master.global?.header, tenant.global?.header),
    footer: mergeComponentArrays(master.global?.footer, tenant.global?.footer),
  };

  // Merge Pages
  const pages: Record<string, UIComponentRef[]> = {};

  // Get all unique page keys from both master and tenant
  const allPageKeys = new Set([
    ...Object.keys(master.pages || {}),
    ...Object.keys(tenant.pages || {}),
  ]);

  allPageKeys.forEach((pageKey) => {
    pages[pageKey] = mergeComponentArrays(
      master.pages?.[pageKey],
      tenant.pages?.[pageKey],
    );
  });

  return {
    ...master, // keep master shape
    ...tenant, // overwrite with tenant base fields
    isMaster: false, // merged result is always a tenant view
    global,
    pages,
    metadata: { ...master.metadata, ...tenant.metadata },
  };
}
