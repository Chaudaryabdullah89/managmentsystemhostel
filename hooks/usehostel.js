import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { QueryClient, QueryKeys } from "../lib/queryclient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


export function useHostel() {

    const queryClient = useQueryClient()
    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: [...QueryKeys.hostellist()],
        queryFn: async () => {
            const response = await fetch("/api/hostels?limit=100")
            if (!response.ok) {
                toast("Error Occurs While Loading Hostels")
                throw new Error("Error Occurs While Loading Hostels");
            }
            return await response.json()
        },
        gcTime: 30 * 60 * 1000,
        staleTime: 60 * 1000
    })
    return { data, isLoading, error, isFetching }
}

export function useHostelById(id) {
    const { data, isLoading, error, isFetching } = useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: [...QueryKeys.hostellist(), id],
        queryFn: async () => {
            const response = await fetch(`/api/hostels/${id}`)
            if (!response.ok) {
                throw new Error("Error loading property profile");
            }
            return await response.json()
        },
        enabled: !!id
    })
    return { data, isLoading, error, isFetching }
}

export function useInfiniteHostels(limit = 5) {
    return useInfiniteQuery({
        queryKey: [...QueryKeys.hostellist(), "infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await fetch(`/api/hostels?page=${pageParam}&limit=${limit}`);
            if (!response.ok) {
                toast("Error fetching more hostels");
                throw new Error("Failed to fetch hostels");
            }
            return response.json();
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.pagination?.hasNextPage) {
                return lastPage.pagination.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });
}

export function CreateHostel() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const { mutate, isPending, error, data } = useMutation({
        mutationFn: async function (data) {
            const response = await fetch("/api/hostels/createhostel",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify(data)
                }
            )
            if (!response.ok) {
                toast("Error Occurs While Creating Hostel")
                throw new Error("Error Occurs While Creating Hostel");
            }
            return await response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...QueryKeys.hostellist()] })
            toast("Hostel Created Successfully")
            router.push("/admin/hostels")

        },
        onError: () => {
            toast("Error Occurs While Creating Hostel")
        }
    })
    return { mutate, isPending, error, data }
}

export function UpdateHostel() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const { mutate, isPending, error, data } = useMutation({
        mutationFn: async function (formData) {
            const response = await fetch(`/api/hostels/edithostel`,
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify(formData)
                })
            if (!response.ok) {
                const res = await response.json()
                toast(res.message || "Error Occurs While Updating Hostel")
                throw new Error(res.message || "Error Occurs While Updating Hostel");
            }
            return await response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...QueryKeys.hostellist()] })
            toast("Hostel Updated Successfully")
            router.push("/admin/hostels")
        },
        onError: () => {
            toast("Error Occurs While Updating Hostel")
        }
    })
    return { mutate, isPending, error, data }
}
export function deletehostel() {
    const queryClient = useQueryClient()
    const { mutate, isPending, data } = useMutation({
        mutationFn: async (id) => {
            try {
                const response = await fetch(`/api/hostels/deletehostel`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({ id })
                })
                if (!response.ok) {
                    const res = await response.json()
                    toast(res.message || "Error Occurs While Deleting Hostel")
                    throw new Error(res.message || "Error Occurs While Deleting Hostel");
                }
                return await response.json()
            } catch (error) {

            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...QueryKeys.hostellist()] })
            toast("Hostel Deleted Successfully")

        },
        onError: () => {
            toast("Error Occurs While Deleting Hostel")
        }
    })
    return { mutate, isPending, data }
}