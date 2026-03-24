"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ProductListPage() {
    const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory = categoryFilter
      ? product.category?.includes(categoryFilter)
      : true;

    const matchesCollection = collectionFilter
      ? product.collections?.includes(collectionFilter)
      : true;

    return matchesSearch && matchesCategory && matchesCollection;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div>
      <div style={headerRow}>
        <h1>Product List</h1>

        <button
           onClick={() => router.push("/admin/add-product/new")}
           style={addButton}
        >
         + Add New Product
        </button>
      </div>
      {/* 🔎 FILTER BAR */}
      <div style={filterBar}>
        <input
          placeholder="Search product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={dropdown}
        >
          <option value="">All Categories</option>
          <option value="regular_fit">Regular Fit</option>
          <option value="oversized_fit">Oversized Fit</option>
          <option value="mens_polo">Men&apos;s Polo</option>
          <option value="mens_gym">Men&apos;s Gym</option>
          <option value="mens_sweatshirts">Men&apos;s Sweatshirts</option>
        </select>

        <select
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
          style={dropdown}
        >
          <option value="">All Collections</option>
          <option value="solid">Solid</option>
          <option value="printed">Printed</option>
          <option value="minimalist">Minimalist</option>
          <option value="street_wear">Street Wear</option>
          <option value="aesthetic">Aesthetic</option>
          <option value="puffed">Puffed</option>
          <option value="acid_washed">Acid Washed</option>
          <option value="supima">Supima</option>
        </select>
      </div>

      {/* TABLE */}
      <div style={tableWrapper}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadRow}>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Collection</th>
              <th>Original MRP</th>
              <th>Discounted MRP</th>
            </tr>
          </thead>

          <tbody>
            {paginatedProducts.map((product) => (
              <tr key={product.id} style={tbodyRow}>
                <td>
                  {product.images?.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      width={90}
                      height={90}
                      style={{
                        borderRadius: "10px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={imagePlaceholder} />
                  )}
                </td>

                <td style={{ fontWeight: 600 }}>{product.title}</td>

                <td>
                  {product.category?.join(", ").replaceAll("_", " ")}
                </td>

                <td>
                  {product.collections?.join(", ").replaceAll("_", " ")}
                </td>

                <td>₹ {product.price_before}</td>

                <td>
                  <strong>₹ {product.price_after}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div style={{ padding: "20px" }}>No products found.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationWrapper}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            style={pageButton}
            >
            Previous
          </button>

        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index + 1)}
            style={{
                ...pageButton,
            background:
              currentPage === index + 1 ? "#111827" : "#e5e7eb",
            color:
              currentPage === index + 1 ? "white" : "black",
              }}
            >
            {index + 1}
          </button>
        ))}

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(currentPage + 1)}
      style={pageButton}
    >
      Next
    </button>
  </div>
)}
    </div>
  );
}

/* STYLES */

const filterBar = {
  display: "flex",
  gap: "15px",
  marginBottom: "20px",
};

const searchInput = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  width: "250px",
};

const dropdown = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ddd",
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
  width: "90px",
  height: "90px",
  background: "#e5e7eb",
  borderRadius: "10px",
};

const headerRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  };
  
  const addButton = {
    padding: "10px 18px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
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