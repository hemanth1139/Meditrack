"use client";

import { useState, useEffect } from "react";

export default function DashboardGreeting({ name, hospital }) {
  const [greeting, setGreeting] = useState("Hello");
  const [dateText, setDateText] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setDateText(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const firstName = name?.split(" ")[0] || "there";

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-800">
        {greeting}, {firstName} 👋
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        {dateText || "Loading date..."}
        {hospital && (
          <span className="ml-2 text-blue-500 font-medium">• {hospital}</span>
        )}
      </p>
    </div>
  );
}
