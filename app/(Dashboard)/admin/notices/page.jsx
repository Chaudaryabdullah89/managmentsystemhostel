"use client"
import React, { useState } from 'react'
import WardenNoticePage from "../../warden/notices/page"

const AdminNoticePage = () => {
    // We can reuse the Warden page as it handles the logic based on the user's hostelId
    // and for admin, hostelId is usually null or they can manage all
    return <WardenNoticePage />
}

export default AdminNoticePage
