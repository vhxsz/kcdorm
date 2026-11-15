"use client";

import {
  AdminPanel,
  presentationCategories,
  presentationMenu,
} from "../../page";

export function AdminPreviewClient() {
  return (
    <AdminPanel
      previewMode
      items={presentationMenu}
      categories={presentationCategories}
      onCategoryAdded={() => undefined}
      onProductAdded={() => undefined}
      onProductUpdated={() => undefined}
      onProductDeleted={() => undefined}
      onRefreshProducts={async () => true}
      productsError=""
      onBack={() => window.location.assign("/")}
    />
  );
}
