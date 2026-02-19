import HostelServices from "../../../../lib/services/hostelservices/hostelservices";
const hostelServices = new HostelServices()

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 5
    return hostelServices.gethostels(page, limit)
}
