"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@lib/supabaseClient";
import { Promotion } from "types/promotion";

export default function StaffScanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<string>(""); // promotion ID

  // Fetch active promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      const { data, error } = await supabase
        .from("promotions") // FIX: Removed the generic <Promotion>
        .select("*")
        .eq("active", true);

      if (!error && data) setPromotions(data);
      else console.error(error);
    };

    fetchPromotions();
  }, []);

  // QR scanner
  useEffect(() => {
    if (!selectedPromotion) return; // don't start scanning until a promotion is selected

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        console.log("✅ Scanned QR Code:", decodedText);

        // Redeem promotion
        const customerId = decodedText;

        // Check if already redeemed
        const { data: existing, error: checkError } = await supabase
          .from("redemptions")
          .select("*")
          .eq("customer_id", customerId)
          .eq("promotion_id", selectedPromotion)
          .single();

        if (checkError) {
          console.error(checkError);
          alert("Error checking redemption");
          return;
        }

        if (existing) {
          alert("This promotion has already been redeemed by this customer!");
          return;
        }

        // Insert redemption
        const { error: insertError } = await supabase
          .from("redemptions")
          .insert({ customer_id: customerId, promotion_id: selectedPromotion, redeemed_at: new Date() });

        if (insertError) {
          console.error(insertError);
          alert("Error redeeming promotion");
          return;
        }

        alert("✅ Promotion redeemed successfully!");
      },
      (errorMessage) => {
        console.warn("Scan error:", errorMessage);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error("Clear error:", err));
    };
  }, [selectedPromotion]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-xl font-bold mb-4">Staff QR Scanner</h1>

      {/* Promotion selector */}
      <div className="mb-4 w-full max-w-md">
        <label className="block font-semibold mb-1">Select Promotion:</label>
        <select
          className="w-full border rounded p-2"
          value={selectedPromotion}
          onChange={(e) => setSelectedPromotion(e.target.value)}
        >
          <option value="">-- Select a promotion --</option>
          {promotions.map((promo) => (
            <option key={promo.id} value={promo.id}>
              {promo.title} {promo.points_required ? `(${promo.points_required} points)` : ""}
            </option>
          ))}
        </select>
      </div>

      <div id="reader" className="w-full max-w-md" />
    </div>
  );
}
