"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@lib/supabaseClient";
import { QRCodeCanvas } from "qrcode.react";

interface Redemption {
  id: string;
  qr_token: string;
  promotion_id: string;
  status: string;
}

export default function RedemptionPage() {
  const router = useRouter();
  const params = useParams();
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRedemption = async () => {
      const { data, error } = await supabase
            // FIX: Removed <Redemption>
        .from("redemptions")
        .select("*")
        .eq("id", params.id)
        
        .single();
      if (error || !data) {
        alert("Redemption not found.");
        router.push("/dashboard");
        return;
      }

      setRedemption(data);
      setLoading(false);
    };

    fetchRedemption();
  }, [params.id, router]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!redemption) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-center">Redeem Promotion</h1>
      <p className="mb-4 text-center">
        Show this QR code to the staff to complete your redemption.
      </p>
      <div className="p-6 bg-white shadow-md rounded-xl">
        <QRCodeCanvas value={redemption.qr_token} size={200} />
      </div>
      <p className="mt-4 text-center text-gray-600">Status: {redemption.status}</p>
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
