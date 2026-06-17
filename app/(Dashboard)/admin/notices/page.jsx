"use client";
import React from "react";
import NoticePage from "../../warden/notices/page";

// Admin reuses the full notice board — which handles both hostel-specific
// and global notices via the API's permission + filter logic.
const AdminNoticePage = () => {
  return <NoticePage />;
};

export default AdminNoticePage;
