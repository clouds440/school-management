"use client";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000")
      .then((res) => res.json())
      .then((data) => setMsg(data.message))
      .catch((err) => setMsg("Error: " + err.message));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Frontend ↔ Backend Test</h1>
      <p>{msg}</p>
    </div>
  );
}
