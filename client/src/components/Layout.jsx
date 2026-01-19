import React from "react";
import { Link, NavLink } from "react-router-dom";
import Header from "./Header";
import { useAuth } from "../state/auth";
import Footer from "./Footer";


export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-cream-100">
      <Header/>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

      <Footer/>
    </div>
  );
}
