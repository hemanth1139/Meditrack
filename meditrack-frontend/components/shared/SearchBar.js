"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchBar({ placeholder = "Search...", defaultValue = "", onSearch }) {
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-9 bg-white shadow-sm"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
