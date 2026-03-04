
import { QueryClient as TanstackQueryClient } from "@tanstack/react-query";

export const QueryClient = new TanstackQueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 1000, // 5 seconds instead of 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes instead of 30
            retry: 2,
            retryDelay: 1000,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchInterval: false,
        },
        mutations: {
            retry: 1,
            retryDelay: 1000,
        }
    },
});

export const QueryKeys = {
    users: "users",
    userlist: function () { return [this.users, "list"] },
    userbyrole: function (role) { return [this.users, "byrole", role] },
    userbyid: function (id) { return [this.users, "byid", id] },
    userbyemail: function (email) { return [this.users, "byemail", email] },
    updateuser: function (id) { return [this.users, "update", id] },
    deleteuser: function (id) { return [this.users, "delete", id] },
    createuser: function (data) { return [this.users, "create", data] },
    userDetailedProfile: function (id) { return [this.users, "detailed", id] },

    hostels: "hostels",
    hostellist: function () { return [this.hostels, "list"] },
    hostelbyid: function (id) { return [this.hostels, "byid", id] },
    createhostel: function (data) { return [this.hostels, "createhostel", data] },

    Rooms: "Rooms",
    Roomlist: function () { return [this.Rooms, "list"] },
    Roombyid: function (id) { return [this.Rooms, "byid", id] },
    Roombyhostelid: function (id) { return [this.Rooms, "byhostelid", id] },
    createRoom: function (data) { return [this.Rooms, "createRoom", data] },
    singleRoombyHostelId: function (hostelid, roomid) { return [this.Rooms, "singleRoombyHostelId", hostelid, roomid] }
}