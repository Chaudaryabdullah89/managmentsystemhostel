
import { QueryClient as TanstackQueryClient } from "@tanstack/react-query";

export const QueryClient = new TanstackQueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - significantly reduces redundant fetches
            gcTime: 30 * 60 * 1000, // 30 minutes
            retry: 1, // Reduce retries for faster failure feedback
            retryDelay: 1000,
            refetchOnWindowFocus: false, // Prevents refetching every time the user comes back to the tab
            refetchOnMount: true,
            refetchInterval: false,
            refetchOnReconnect: false, // Prevents refetching on minor connection re-establishment
        },
        mutations: {
            retry: 0, // Fail fast on mutations
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