"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function StaffScanner() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10, // scans per second
        qrbox: { width: 250, height: 250 }, // size of the scanning box
      },
      false // verbose logging
    );

    scanner.render(
      (decodedText) => {
        console.log("✅ Scanned QR Code:", decodedText);
        alert(`Scanned: ${decodedText}`);
        // TODO: Call Supabase to validate/redeem promotion here
      },
      (errorMessage) => {
        // Errors during scanning (not always critical)
        console.warn("Scan error:", errorMessage);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error("Clear error:", err));
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-xl font-bold mb-4">Staff QR Scanner</h1>
      <div id="reader" className="w-full max-w-md" />
    </div>
  );
}
