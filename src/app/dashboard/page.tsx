"use client";
import { useEffect, useState } from "react";
import { supabase } from "@lib/supabaseClient";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/navigation";
import { CustomerRow } from "types/customer";
import { Promotion } from "types/promotion";

export default function Dashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch customer
  useEffect(() => {
    const fetchCustomer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        router.push("/login");
        return;
      }

      const email = user.email;

      const { data: existingCustomer } = await supabase
        .from<CustomerRow>("customers")
        .select("*")
        .eq("email", email)
        .single() as { data: CustomerRow | null; error: any };

      if (!existingCustomer) {
        router.push("/customer-details");
        return;
      }

      setCustomer({
        ...existingCustomer,
        firstName: existingCustomer.first_name,
        lastName: existingCustomer.last_name, //same in column for supabase.
      });;
      setLoading(false);
    };

    fetchCustomer();
  }, [router]);

  // Fetch promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      const { data, error } = await supabase
        .from<Promotion>("promotions")
        .select("*")
        .eq("active", true);

      if (!error && data) {
        setPromotions(data);
      }
    };

    fetchPromotions();
  }, []);

  // Redemption Logic
  const handleRedeem = async (promo: Promotion) => {
  if (!customer) return;

  // Create redemption record
  const { data, error } = await supabase
    .from("redemptions")
    .insert({
      user_id: customer.id,
      promotion_id: promo.id
    })
    .select()
    .single(); // return the inserted row

  if (error) {
    alert("Error creating redemption: " + error.message);
    return;
  }

  if (data) {
    // Redirect to redemption page
    router.push(`/redemption/${data.id}`);
  }
};


  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!customer) return <p className="text-center mt-10">Customer not found.</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {customer.firstName || "Your"} Loyalty Card
      </h1>

      <div className="p-6 bg-white shadow-md rounded-xl mb-4">
        <QRCodeCanvas value={customer.id} size={200} />
      </div>

      <p className="text-lg font-medium mb-4">Points: {customer.points}</p>

      <button
        onClick={() => router.push("/customer-details")}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Update Your Details
      </button>

      {/* Promotions Section */}
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-4 mt-6">
        <h2 className="text-lg font-bold mb-2 text-blue-600">Active Promotions</h2>
        {promotions.length > 0 ? (
          promotions.map((promo) => (
            <div
              key={promo.id}
              className="border-b py-3 last:border-none flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{promo.title}</h3>
                {promo.description && (
                  <p className="text-sm text-gray-600">{promo.description}</p>
                )}
                {promo.points_required !== null && (
                  <p className="text-sm text-gray-800">
                    Requires {promo.points_required} points
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {promo.start_date} → {promo.end_date}
                </p>
              </div>
              <button
                  onClick={() => handleRedeem(promo)}
                  className="ml-4 bg-green-500 text-white px-3 py-1 rounded text-sm"
                >
                  Redeem
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No active promotions.</p>
        )}
      </div>


          {/* Logout Section */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}