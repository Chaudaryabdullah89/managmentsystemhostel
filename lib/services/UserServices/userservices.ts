import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";


export const userUpdate = async (id: string, data: any) => {

    const user = await prisma.user.findUnique({ where: { id: id } })
    if (!user) {
        return { message: "User not found", status: 404, data: data, notupdatedUser: user, success: false }
    }

    const updatedUser = await prisma.user.update({
        where: { id: id },
        data: data
    })

    return { message: "User updated successfully", status: 200, data: data, updatedUser: updatedUser, success: true }

}