"use client";
import { useEffect, useState } from "react";
import { supabase } from "@lib/supabaseClient";
import { useRouter } from "next/navigation";
import { CustomerRow } from "types/customer";

export default function CustomerDetails() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [birthday, setBirthday] = useState("");

  // Fetch or create customer
  useEffect(() => {
    const fetchOrCreateCustomer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        router.push("/login");
        return;
      }

      const email = user.email;

      const { data: existingCustomer, error: fetchError } = await supabase
        .from<CustomerRow>("customers")
        .select("*")
        .eq("email", email)
        .single() as { data: CustomerRow | null; error: any };

      if (fetchError) console.error("Error fetching customer:", fetchError);

      if (!existingCustomer) {
        const { data: newCustomer, error: insertError } = await supabase
          .from<CustomerRow>("customers")
          .insert({ email, points: 0 })
          .select()
          .single() as { data: CustomerRow | null; error: any };

        if (insertError) console.error("Error creating customer:", insertError);

        setCustomer(newCustomer);
        setFirstName(newCustomer?.firstName || "");
        setLastName(newCustomer?.lastName || "");
        setContactNumber(newCustomer?.contactNumber || "");
        setBirthday(newCustomer?.birthday || "");
      } else {
        setCustomer(existingCustomer);
        setFirstName(existingCustomer?.firstName || "");
        setLastName(existingCustomer?.lastName || "");
        setContactNumber(existingCustomer?.contactNumber || "");
        setBirthday(existingCustomer?.birthday || "");
      }

      setLoading(false);
    };

    fetchOrCreateCustomer();
  }, [router]);

  const handleUpdateDetails = async () => {
    if (!customer) return;
    setUpdating(true);

    const { data, error } = await supabase
      .from<CustomerRow>("customers")
      .update({
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber,
        birthday: birthday,
      })
      .eq("id", customer.id)
      .select()
      .single() as { data: CustomerRow | null; error: any };

    if (error) {
      console.error("Error updating customer:", error);
    } else {
      setCustomer(data);
    }

    setUpdating(false);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
    <button
        onClick={() => router.push("/dashboard")}
        className="self-start mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
    >
        ← Back to Dashboard
    </button>

      <h1 className="text-2xl font-bold mb-4 text-center text-blue-600">
        Update Your Details
      </h1>

      <div className="p-6 bg-white shadow-md rounded-xl w-full max-w-sm">
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="border p-2 rounded mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border p-2 rounded mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Contact Number"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="border p-2 rounded mb-2 w-full"
        />
        <input
          type="date"
          placeholder="Birthday"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="border p-2 rounded mb-2 w-full"
        />

        <button
          onClick={handleUpdateDetails}
          disabled={updating}
          className="bg-green-500 text-white px-4 py-2 rounded w-full"
        >
          {updating ? "Updating..." : "Save Details"}
        </button>
      </div>
    </div>
  );
}
