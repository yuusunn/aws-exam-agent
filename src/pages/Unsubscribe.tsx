import { useEffect, useState } from "react";
import { apiPost } from "../services/apiClient";
import { useSearchParams } from "react-router-dom";

export default function Unsubscribe() {
  const [sp] = useSearchParams();
  const email = sp.get("email");
  const [msg, setMsg] = useState("Processing...");

  useEffect(() => {
    (async () => {
      if (!email) { setMsg("Missing email."); return; }
      try {
        await apiPost("/unsubscribe", { email });
        setMsg("You have been unsubscribed.");
      } catch (e: any) {
        setMsg(e?.message || "Failed to unsubscribe. Please try again later.");
      }
    })();
  }, [email]);

  return (
    <div className="prose">
      <h2>Unsubscribe</h2>
      <p>{msg}</p>
    </div>
  );
}