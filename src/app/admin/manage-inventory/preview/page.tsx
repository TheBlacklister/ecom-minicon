"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

//const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function InventoryPreviewPage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const selectedIds = JSON.parse(
        localStorage.getItem("inventorySelected") || "[]"
      );

      const storedUpdates = JSON.parse(
        localStorage.getItem("inventoryUpdates") || "{}"
      );

      if (selectedIds.length === 0) {
        router.push("/admin/manage-inventory");
        return;
      }

      setUpdates(storedUpdates);

      const { data } = await supabase
        .from("products")
        .select("*")
        .in("id", selectedIds);

      if (data) setProducts(data);
    };

    loadData();
  }, [router]);

  const mergeInventory = (product: any) => {
    return product.inventory.map((item: any) => {
      const updated =
        updates[product.id] &&
        updates[product.id][item.size] !== undefined;
  
      return {
        size: item.size,
        quantity: updated
          ? updates[product.id][item.size]
          : item.quantity,
      };
    });
  };

  const formatAvailableSizes = (inventory: any[]) => {
    const available = inventory.filter(
      (item) => item.quantity === null || item.quantity > 0
    );
  
    if (available.length === 0) {
      return "Out of Stock";
    }
  
    if (
      available.length === inventory.length &&
      available.every((i) => i.quantity === null)
    ) {
      return "All Sizes Available";
    }
  
    return available
      .map((item) => {
        if (item.quantity === null) {
          return item.size;
        }
  
        if (item.quantity <= 10) {
          return `${item.size} - Only ${item.quantity} left`;
        }
  
        return item.size;
      })
      .join(", ");
  };

  const handleConfirm = async () => {
    setLoading(true);

    for (const product of products) {
      const mergedInventory = mergeInventory(product);

      await supabase
        .from("products")
        .update({ inventory: mergedInventory })
        .eq("id", product.id);
    }

    localStorage.removeItem("inventorySelected");
    localStorage.removeItem("inventoryUpdates");

    router.push("/admin/manage-inventory");
  };

  return (
    <div>
      <div style={headerRow}>
        <h1>Preview Inventory Updates</h1>

        <button
          onClick={handleConfirm}
          style={primaryButton}
          disabled={loading}
        >
          {loading ? "Saving..." : "Confirm & Save"}
        </button>
      </div>

      <div style={tableWrapper}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadRow}>
              <th>Image</th>
              <th>Product</th>
              <th>Available Sizes</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const merged = mergeInventory(product);

              return (
                <tr key={product.id} style={tbodyRow}>
                  <td>
                    {product.images?.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={70}
                        height={70}
                        style={{
                          borderRadius: "10px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={imagePlaceholder} />
                    )}
                  </td>

                  <td style={{ fontWeight: 600 }}>
                    {product.title}
                  </td>

                  <td>
                    {formatAvailableSizes(merged)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const primaryButton = {
  padding: "10px 18px",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontWeight: 500,
};

const tableWrapper = {
  background: "white",
  borderRadius: "12px",
  padding: "25px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const theadRow = {
  textAlign: "left" as const,
  borderBottom: "1px solid #e5e7eb",
};

const tbodyRow = {
  borderBottom: "1px solid #f1f5f9",
};

const imagePlaceholder = {
  width: "70px",
  height: "70px",
  background: "#e5e7eb",
  borderRadius: "10px",
};