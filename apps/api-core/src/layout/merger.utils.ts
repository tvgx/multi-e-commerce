import { ShopLayout, UIComponentRef } from '@ecommerce/schema';

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
  master: ShopLayout,
  tenant: ShopLayout,
): ShopLayout {
  // If tenant is not inheriting, just return tenant.
  if (!tenant.templateType || !master) {
    return tenant;
  }

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
    pages,
    metadata: { ...master.metadata, ...tenant.metadata },
  };
}
