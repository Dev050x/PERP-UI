"use client";
import React, { useState } from "react";
import Link from "next/link";

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const SigninPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Logged in successfully!");
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-[440px] bg-[#14161C] border border-[#23262F] rounded-2xl p-9 flex flex-col items-center shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-7">Log in</h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {/* Email Input */}
          <div className="w-full">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-13 px-4.5 bg-[#1E2026] border border-[#2B2F36] rounded-xl text-base text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#424755] transition-colors"
            />
          </div>

          {/* Password Input */}
          <div className="w-full relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-13 pl-4.5 pr-12 bg-[#1E2026] border border-[#2B2F36] rounded-xl text-base text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#424755] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-[#5E6673] hover:text-white transition-colors"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* Log in Action Button */}
          <button
            type="submit"
            className="w-full h-13 mt-2 bg-white hover:bg-[#EAECEF] text-[#0B0E11] font-bold text-base rounded-xl transition-all shadow-md active:scale-[0.99]"
          >
            Log in
          </button>
        </form>

        {/* Footer Links */}
        <div className="w-full mt-7 flex items-center justify-between text-sm text-[#848E9C]">
          <div>
            New here?{" "}
            <Link href="/signup" className="text-[#3B82F6] hover:underline font-semibold ml-1">
              Sign up
            </Link>
          </div>

          <a href="#" className="text-[#3B82F6] hover:underline font-semibold">
            Forgot Password
          </a>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;
