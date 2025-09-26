"use client";
import { useState, useEffect } from "react";
import { supabase } from "@lib/supabaseClient";
import { useRouter } from "next/navigation";
import { QrReader } from "react-qr-reader";
import { CustomerRow } from "types/customer";
import { Promotion } from "types/promotion";

interface Redemption {
  id: string;
  qr_token: string;
  status: string;
  user_id: string;
  promotion_id: string;
}

export default function StaffRedemptions() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleScan = (data: string | null) => {
    if (data) {
      setScanResult(data);
      processRedemption(data);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setMessage("Error scanning QR code");
  };

  const processRedemption = async (qr_token: string) => {
    if (processing) return;
    setProcessing(true);
    setMessage(null);

    // 1. Get redemption by qr_token
    const { data: redemption, error: redError } = await supabase
      .from<Redemption>("redemptions")
      .select("*")
      .eq("qr_token", qr_token)
      .single();

    if (redError || !redemption) {
      setMessage("Redemption not found");
      setProcessing(false);
      return;
    }

    if (redemption.status !== "pending") {
      setMessage("This redemption has already been used");
      setProcessing(false);
      return;
    }

    // 2. Get promotion
    const { data: promo, error: promoError } = await supabase
      .from<Promotion>("promotions")
      .select("*")
      .eq("id", redemption.promotion_id)
      .single();

    if (promoError || !promo) {
      setMessage("Promotion not found");
      setProcessing(false);
      return;
    }

    // 3. Get customer
    const { data: customer, error: custError } = await supabase
      .from<CustomerRow>("customers")
      .select("*")
      .eq("id", redemption.user_id)
      .single();

    if (custError || !customer) {
      setMessage("Customer not found");
      setProcessing(false);
      return;
    }

    if (customer.points < promo.points_required) {
      setMessage("Customer does not have enough points");
      setProcessing(false);
      return;
    }

    // 4. Deduct points and mark redemption as redeemed
    const { error: updateError } = await supabase
      .from("customers")
      .update({ points: customer.points - promo.points_required })
      .eq("id", customer.id);

    if (updateError) {
      setMessage("Error updating customer points");
      setProcessing(false);
      return;
    }

    const { error: redemptionUpdateError } = await supabase
      .from("redemptions")
      .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
      .eq("id", redemption.id);

    if (redemptionUpdateError) {
      setMessage("Error updating redemption status");
      setProcessing(false);
      return;
    }

    setMessage(`Redemption successful for ${customer.first_name} ${customer.last_name} (${promo.title})`);
    setProcessing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-center">Staff Redemption</h1>

      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-4">
        <p className="mb-2 text-gray-700">Scan a customer QR code to redeem a promotion:</p>

        <QrReader
          constraints={{ facingMode: "environment" }}
          onResult={(result, error) => {
            if (!!result) handleScan(result.getText());
            if (!!error) handleError(error);
          }}
          containerStyle={{ width: "100%" }}
        />

        {processing && <p className="mt-2 text-blue-500">Processing...</p>}
        {message && <p className="mt-2 text-green-600">{message}</p>}
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
