"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ManageInventoryPage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (data) setProducts(data);
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);

  const toggleSelect = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  /* ✅ FIXED FORMAT LOGIC */
  const formatInventory = (inventory: any[]) => {
    if (!inventory || inventory.length === 0) {
      return "All Sizes Available";
    }

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
        // Unlimited stock
        if (item.quantity === null) {
          return item.size;
        }

        // Low stock
        if (item.quantity <= 10) {
          return `${item.size} - Only ${item.quantity} left`;
        }

        return item.size;
      })
      .join(", ");
  };

  const handleUpdateClick = () => {
    localStorage.setItem(
      "inventorySelected",
      JSON.stringify(selected)
    );
    router.push("/admin/manage-inventory/edit");
  };

  return (
    <div>
      <div style={headerRow}>
        <h1>Manage Inventory</h1>

        <button
          onClick={handleUpdateClick}
          disabled={selected.length === 0}
          style={{
            ...primaryButton,
            opacity: selected.length > 0 ? 1 : 0.5,
          }}
        >
          Update Inventory
        </button>
      </div>

      <div style={tableWrapper}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadRow}>
              <th>Select</th>
              <th>Image</th>
              <th>Name</th>
              <th>Available Sizes</th>
            </tr>
          </thead>

          <tbody>
            {paginatedProducts.map((product) => (
              <tr key={product.id} style={tbodyRow}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                  />
                </td>

                <td>
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      width={80}
                      height={80}
                      style={{
                        borderRadius: 10,
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
                  {formatInventory(product.inventory)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={paginationWrapper}>
          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage(currentPage - 1)
            }
            style={pageButton}
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() =>
                setCurrentPage(index + 1)
              }
              style={{
                ...pageButton,
                background:
                  currentPage === index + 1
                    ? "#111827"
                    : "#e5e7eb",
                color:
                  currentPage === index + 1
                    ? "white"
                    : "black",
              }}
            >
              {index + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage(currentPage + 1)
            }
            style={pageButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* Styles */

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

const paginationWrapper = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
  justifyContent: "center",
};

const pageButton = {
  padding: "8px 14px",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
};

const imagePlaceholder = {
  width: "80px",
  height: "80px",
  background: "#e5e7eb",
  borderRadius: "10px",
};