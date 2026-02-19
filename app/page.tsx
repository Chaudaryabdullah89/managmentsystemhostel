"use client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  useEffect(() => {
    redirect(`/admin/dashboard/?redirect=true&redirectedfrom=${window.location.pathname}`)
  })
  return (
    <>


    </>
  );
}
