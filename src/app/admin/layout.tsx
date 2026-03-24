import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flex: 1, minHeight: "100%", background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "260px",
          background: "#000000", // solid black
          color: "white",
          padding: "30px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ marginBottom: "40px" }}>MINICON Admin</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <Link href="/admin" style={linkStyle}>
            Dashboard
          </Link>

          <Link href="/admin/add-product" style={linkStyle}>
            Add New Product
          </Link>

          <Link href="/admin/delete-product" style={linkStyle}>
            Delete Products
          </Link>

          <Link href="/admin/hero-banner" style={linkStyle}>
            Update Website Banner
          </Link>

          <Link href="/admin/update-logo" style={linkStyle}>
            Update Brand Logo
          </Link>

          <Link href="/admin/manage-inventory" style={linkStyle}>
            Manage Product Inventory
          </Link>

          <Link href="/admin/top-picks" style={linkStyle}>
            Manage Top Picks of the Week
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          background: "#f8fafc",
          padding: "40px",
        }}
      >
        {children}
      </main>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "12px 14px",
  borderRadius: "6px",
  background: "#111111",
};