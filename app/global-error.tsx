"use client";

// Last resort when the root layout itself fails, so it can't rely on the
// site's layout, fonts or components.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F4F2EC", color: "#0E1621" }}>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px" }}>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>AnchorShip NL is having trouble right now.</h1>
          <p style={{ color: "#3B4A5A", lineHeight: 1.5 }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, padding: "10px 20px", border: 0, borderRadius: 6, background: "#C6602B", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
