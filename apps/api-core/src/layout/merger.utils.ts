import {
  ShopGlobalLayout,
  ShopPageLayout,
  UIComponentRef,
} from '@ecommerce/schema';

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
 * Merges a Tenant's Global Layout with the Master Global Layout
 */
export function mergeGlobalLayouts(
  master: ShopGlobalLayout,
  tenant: ShopGlobalLayout,
): ShopGlobalLayout {
  if (!tenant.templateType || !master) {
    return tenant;
  }

  const globalComponents = mergeComponentArrays(
    master.globalComponents,
    tenant.globalComponents,
  );

  return {
    ...master,
    ...tenant,
    isMaster: false,
    globalComponents,
    theme: { ...master.theme, ...tenant.theme },
  };
}

/**
 * Merges a Tenant's Page Layout with the Master Page Layout
 */
export function mergePageLayouts(
  master: ShopPageLayout,
  tenant: ShopPageLayout,
): ShopPageLayout {
  if (!master) {
    return tenant;
  }

  const components = mergeComponentArrays(master.components, tenant.components);

  return {
    ...master,
    ...tenant,
    isMaster: false,
    components,
  };
}
